import { Card, InfoIcon, Row } from "@egovernments/digit-ui-react-components";
import React from "react";
import { useTranslation } from "react-i18next";

function CardReading(props) {
  const { t } = useTranslation();
  return (
    <Card className="tqm-card-reading">
      {props?.showInfo ? <InfoIcon fill="#F47738" /> : null}
      <Row textStyle={{ color: props?.success ? "#00703C" : "#D4351C" }} className="tqm-readings-info" label={t(props?.title)} text={t(props?.value)} />
    </Card>
  );
}

export function MultiCardReading(props) {
  const { t } = useTranslation();
  return props?.parameterData?.map
    ? props?.parameterData?.map((i) => (
        <Card className="tqm-card-reading">
          <InfoIcon fill="#F47738" />
          <Row
            textStyle={{ color: props?.success ? "#00703C" : "#D4351C" }}
            className="tqm-readings-info"
            label={t(Digit.Utils.locale.getTransformedLocale(`PQM.QualityCriteria_${i?.criteriaCode}`))}
            text={t(props?.value)}
          />
        </Card>
      ))
    : null;
}

export default CardReading;
