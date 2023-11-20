import React, { useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Banner, Card, LinkLabel, ArrowLeftWhite, ActionBar, SubmitBar } from "@egovernments/digit-ui-react-components";

const Response = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const queryStrings = Digit.Hooks.useQueryParams();
  const [testId, setTestId] = useState(queryStrings?.testId);
  const [isResponseSuccess, setIsResponseSuccess] = useState(queryStrings?.isSuccess === "true" ? true : queryStrings?.isSuccess === "false" ? false : true);
  const { state } = useLocation();

  const navigate = (page) => {
    switch (page) {
      case "contracts-inbox": {
        history.push(`/${window.contextPath}/employee/tqm/summary`);
      }
    }
  };

  return (
    <Card>
      <Banner successful={isResponseSuccess} message={t(state?.message)} multipleResponseIDs={testId} whichSvg={`${isResponseSuccess ? "tick" : null}`} />
      <div style={{ display: "flex" }}> {t(state?.text, { TEST_ID: testId })} </div>
      <Link to={`/${window.contextPath}/employee/tqm/summary?id=${testId}`}>
        <SubmitBar label={t("ES_TQM_SEE_SUMMARY_TITLE")} />
      </Link>
    </Card>
  );
};

export default Response;