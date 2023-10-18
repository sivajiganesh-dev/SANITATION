import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PDFSvg } from "@egovernments/digit-ui-react-components";

function DocumentsPreview({ documents, svgStyles = {} }) {
  const { t } = useTranslation();
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const [filesArray, setFilesArray] = useState(null);
  const [pdfFiles, setPdfFiles] = useState({});

  useEffect(() => {
    let acc = documents?.map((i) => i.value);
    setFilesArray(acc);
  }, [documents]);

  useEffect(() => {
    if (filesArray?.length) {
      Digit.UploadServices.Filefetch(filesArray, Digit.ULBService.getStateId()).then((res) => {
        setPdfFiles(res?.data);
      });
    }
  }, [filesArray]);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start" }}>
        {documents.length > 0 ? (
          documents?.map((document, index) => (
            <React.Fragment key={index}>
              <a target="_" href={pdfFiles[document?.value]?.split(",")[0]} style={{ minWidth: "80px", marginRight: "10px", maxWidth: "100px", height: "auto" }} key={index}>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <PDFSvg />
                </div>
                <p className="tqm-document-title">{t(document?.title)}</p>
              </a>
            </React.Fragment>
          ))
        ) : (
          <div>
            <p>{t("ES_TQM_NO_DOCUMENTS_AVAILABLE")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentsPreview;