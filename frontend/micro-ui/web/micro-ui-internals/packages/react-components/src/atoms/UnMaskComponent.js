import PropTypes from "prop-types";
import React, { useState } from "react";
import { PrivacyMaskIcon } from "..";
import { useTranslation } from "react-i18next";

/**
 * Custom Component to demask the masked values.
 *
 * @author jagankumar-egov
 *
 * Feature :: Privacy
 *
 * @example
 * <UnMaskComponent   privacy={{ uuid: "", fieldName: "name", model: "User" ,hide: false}}   />
 */
//loadData=false,
//loadData = {  serviceName="",requestBody={},requestParam=[],jsonPath="",isArray=false}
//isArray={index=0,subJsonPath=""}
const UnMaskComponent = React.memo(({ iseyevisible=true, privacy = {}, style = {} ,unmaskData}) => {
  const { t } = useTranslation();
  // const[privacyState,setPrivacyState]=useState(loadData);
  const { isLoading, data } = Digit.Hooks.useCustomMDMS(
    Digit.ULBService.getStateId(),
    "DataSecurity",
    [{ name: "SecurityPolicy" }],
    {
      select: (data) => data?.DataSecurity?.SecurityPolicy?.find((elem) => elem?.model == privacy?.model) || {},
    }
  );
  const { privacy: privacyValue, updatePrivacy } = Digit.Hooks.usePrivacyContext();
  if (isLoading || privacy?.hide) {
    return null;
  }

  if (Digit.Utils.checkPrivacy(data, privacy) && iseyevisible) {
    sessionStorage.setItem("isPrivacyEnabled","true");
    return (
      <span
        onClick={() => {
          sessionStorage.setItem("eyeIconClicked",privacy?.fieldName);
          if(unmaskData){
            unmaskData();
          }else{
            updatePrivacy(privacy?.uuid, privacy?.fieldName);
          }
        }}
      >
      <div className={`tooltip`}>
        <PrivacyMaskIcon className="privacy-icon" style={style}></PrivacyMaskIcon>
            <span className="tooltiptext" style={{
                    fontSize: "medium",
                    width: "unset",
                    display: "block",
                    marginRight:"-60px",
                  }}>
                   {t("CORE_UNMASK_DATA")}
                  </span>
                </div>
      </span>
    );
  }
  return null;
});

UnMaskComponent.propTypes = {
  privacy: PropTypes.object,
};
UnMaskComponent.defaultProps = {
  privacy: { uuid: "", fieldName: "", model: "" },
};

export default UnMaskComponent;
