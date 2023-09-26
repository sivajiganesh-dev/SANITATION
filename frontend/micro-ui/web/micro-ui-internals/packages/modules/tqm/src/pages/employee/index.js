import React, { useEffect } from "react";
import { Switch, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PrivateRoute, AppContainer, BreadCrumb } from "@egovernments/digit-ui-react-components";
import SampleComp from "./SampleComp";


const TqmBreadCrumb = ({ location ,defaultPath}) => {
  const { t } = useTranslation();
  const search = useLocation().search;

  const crumbs = [
    {
      path: `/${window?.contextPath}/employee`,
      content: t("WORKBENCH_HOME"),
      show: true,
    },
    
  ];
  return <BreadCrumb className="workbench-bredcrumb" crumbs={crumbs} spanStyle={{ maxWidth: "min-content" }} />;
};

const App = ({ path }) => {
  const location = useLocation();
  return (
    <React.Fragment>
      <TqmBreadCrumb location={location} defaultPath={path} />
      <Switch>
        <AppContainer className="tqm">
          <PrivateRoute path={`${path}/sample`} component={() => <SampleComp />} />
        </AppContainer>
      </Switch>
    </React.Fragment>
  );
};

export default App;
