package org.egov.vendor.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;

import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.egov.vendor.config.VendorConfiguration;
import org.egov.vendor.repository.ServiceRequestRepository;
import org.postgresql.util.PGobject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.egov.common.models.individual.*;


import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

import static org.egov.vendor.util.VendorConstants.*;

@Component
@Slf4j
public class UserIndividualMigrationUtil {

    @Autowired
    private VendorConfiguration config;
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private ObjectMapper mapper;
    @Autowired
    private ServiceRequestRepository serviceRequestRepository;


    @Transactional
    public void migrate(RequestInfo requestInfo) {
        log.info("Starting migration");


        String driverDetailsQuery = "SELECT * from eg_driver;";
        List<Map<String,Object>> driverDetails = jdbcTemplate.queryForList(driverDetailsQuery);

        log.info("Fetched Driver details");
        for (Map<String,Object> driver : driverDetails) {

            String driverId = (String) driver.get("id");
            String owner_id = (String) driver.get("owner_id");
            String tenant_id = (String) driver.get("tenantid");

            //fetching user details for a driverId
            String userDetailsQuery =  "SELECT userdata.title, userdata.salutation, userdata.dob, userdata.locale, userdata.username, userdata" +
                    ".password, userdata.pwdexpirydate,  userdata.mobilenumber, userdata.altcontactnumber, userdata.emailid, userdata.createddate, userdata" +
                    ".lastmodifieddate,  userdata.createdby, userdata.lastmodifiedby, userdata.active, userdata.name, userdata.gender, userdata.pan, userdata.aadhaarnumber, userdata" +
                    ".type,  userdata.version, userdata.guardian, userdata.guardianrelation, userdata.signature, userdata.accountlocked, userdata.accountlockeddate, userdata" +
                    ".bloodgroup, userdata.photo, userdata.identificationmark,  userdata.tenantid, userdata.id, userdata.uuid, userdata.alternatemobilenumber, ur.role_code as role_code, ur.role_tenantid as role_tenantid \n" +
                    "\tFROM eg_user userdata LEFT OUTER JOIN eg_userrole_v1 ur ON userdata.id = ur.user_id AND userdata.tenantid = ur.user_tenantid WHERE userdata.uuid = '"+owner_id+"' AND userdata.type = 'CITIZEN';";

            List<Map<String,Object>> userDetails = jdbcTemplate.queryForList(userDetailsQuery);

            log.info("Fetched user details");
            if (userDetails == null || userDetails.isEmpty()) {
                log.info("Userdetails not found for owner Id :: "+ owner_id);
                continue;
            }

            Map<String, Object> userDetail = userDetails.get(0);
            Map<String, String> decrypt = new HashMap<>();

            String userName = (String) userDetail.get("username");
            String mobileNumber = (String) userDetail.get("mobilenumber");
            String name = (String) userDetail.get("name");
            Integer numericGender = (Integer) userDetail.get("gender");
            Timestamp sqlTimestamp = (Timestamp) userDetail.get("dob");
            Date javaDate = new Date(sqlTimestamp.getDate());

            //validating whether individual already exists with the mobile number
            String individualSearchQuery = "Select * from individual where mobilenumber = ''"+mobileNumber;
            List<Map<String,Object>> existingindividualList  = jdbcTemplate.queryForList(userDetailsQuery);

            if(!existingindividualList.isEmpty())
            {
                log.error("Individual already exists with the given mobile number");
                continue;
            }


            //decrypting encrypted fields
            decrypt.put("username", userName);
            decrypt.put("mobilenumber", mobileNumber);
            decrypt.put("name", name);
            log.info("Calling for decryption");
            Map<String, String> decryptedValues = encryptionDecryptionUtil(decrypt, false);

            String decryptedName = decryptedValues.get("name");
            String decryptedMobileNumber = decryptedValues.get("mobilenumber");

            Individual individual = Individual.builder().tenantId(tenant_id).name(Name.builder().givenName(decryptedName).build())
                    .mobileNumber(decryptedMobileNumber).dateOfBirth(javaDate).gender(getGender(numericGender)).isSystemUser(Boolean.FALSE).build();

            addDriverRelatedSkills(individual);

            IndividualRequest createIndividual = createIndividual(new IndividualRequest(requestInfo, individual));
            log.info("Successfully created individual with Individual Id = "+createIndividual.getIndividual().getIndividualId());

            String vendorIDQuery = "SELECT vendor_id FROM eg_vendor_driver WHERE driver_id = ?";
            String vendorId =  jdbcTemplate.queryForObject(vendorIDQuery, String.class, driverId);

            //insert into vendor-sanitation worker mapping table
            String insertQuery = "INSERT INTO eg_vendor_sanitation_worker (vendor_id, individual_id, vendor_sw_status) VALUES (?, ?, ?)";
            jdbcTemplate.update(insertQuery, vendorId, createIndividual.getIndividual().getIndividualId(), "ACTIVE");

        }
        log.info("Ending migration....");
    }

    private Map<String, String> encryptionDecryptionUtil(Map<String, String> encryptionDecryptionMap, Boolean isEncryption) {
        JsonNode request = null;
        StringBuilder uri = new StringBuilder();
        Map<String,Object> encryptionRequestMap = new HashMap<>();
        Map<String, List<Object>> requestMap = new HashMap<>();

        if (isEncryption == true){
            log.info("Encrypting mobile number");
            uri.append(config.getEncryptionHost()).append(config.getEncryptionEndpoint());
            Map<String,String> valueMap = new HashMap<>();
            valueMap.put("contact_mobile_number",encryptionDecryptionMap.get("contact_mobile_number"));
            encryptionRequestMap.put("tenantId",encryptionDecryptionMap.get("tenant_id"));
            encryptionRequestMap.put("type","Normal");
            encryptionRequestMap.put("value",valueMap);

            requestMap.put("encryptionRequests",Collections.singletonList(encryptionRequestMap));

        }else {
            log.info("Decrypting Encrypted values");
            uri.append(config.getEncryptionHost()).append(config.getDecryptionEndpoint());
            request = mapper.createObjectNode()
                    .put("mobilenumber",encryptionDecryptionMap.get("mobilenumber"))
                    .put("name",encryptionDecryptionMap.get("name"))
                    .put("emailid",encryptionDecryptionMap.get("emailid"))
                    .put("username",encryptionDecryptionMap.get("username"));
            requestMap = mapper.convertValue(request,Map.class);
        }
        Object response = serviceRequestRepository.fetchResult(uri, requestMap);
        log.info("Got response from encryption service");
        JsonNode responseMap = mapper.valueToTree(response);
        JsonNode encryptedOrDecryptedValue = null;
        if (responseMap.isArray()) {
            encryptedOrDecryptedValue = responseMap.get(0);
        }else {
            encryptedOrDecryptedValue = responseMap;
        }
        Map<String,String> encryptedOrDecryptedMap = mapper.convertValue(encryptedOrDecryptedValue, Map.class);
        log.info("Successfully mapped encryption service");
        return encryptedOrDecryptedMap;
    }

    /**
     * creates individual
     * @param individualRequest
     */
    public IndividualRequest createIndividual(IndividualRequest individualRequest)
    {
        StringBuilder uri = new StringBuilder(config.getIndividualHost() + config.getIndividualCreateEndpoint());
        IndividualRequest individual=null;
        try {
            Object resp = serviceRequestRepository.fetchResult(uri, individualRequest);
            individual = mapper.convertValue(resp,IndividualRequest.class);
        }
        catch (Exception e)
        {
            throw new CustomException("UNABLE TO CREATE INDIVIUAL", " Unable to create individual with id "+String.format("{Workflow:%s}", individualRequest.getIndividual().getIndividualId()));
        }

        return individual;
    }


    /**
     * adds driver related skills to individual object
     * @param individual
     */
    private void addDriverRelatedSkills(Individual individual)
    {
        Skill skill = Skill.builder().type(SKILL_DRIVER).level(SKILL_LEVEL_UNSKILLED).build();
        individual.addSkillsItem(skill);
    }

    /**
     *
     * @param numericGender
     * @return gender mapped to the specific number
     */
    private static Gender getGender(int numericGender) {
        Gender gender;

        switch (numericGender) {
            case 0:
                gender = Gender.FEMALE;
                break;
            case 1:
                gender = Gender.MALE;
                break;
            case 2:
                gender = Gender.OTHER;
                break;
            case 3:
                gender = Gender.TRANSGENDER;
                break;
            default:
                gender = Gender.OTHER;
                break;
        }

        return gender;
    }

}
