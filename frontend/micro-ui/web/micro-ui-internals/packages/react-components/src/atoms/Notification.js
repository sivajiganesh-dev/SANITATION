import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import Header from "./Header";
import Button from "./Button";
import { CloseSvg, NotificationBell } from "./svgindex";

const Notification = ({ header, actions, eventNotificationText, timePastAfterEventCreation, timeApproxiamationInUnits }) => {
    const { t } = useTranslation();

    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        setNotifications(actions || []);
    }, []);

    const handleClearAll = () => {
        setNotifications([]);
    };
    console.log("Notifications:", notifications);

    const handleClearNotification = (index) => {
        const updatedNotifications = [...notifications];
        updatedNotifications.splice(index, 1);
        setNotifications(updatedNotifications);
    };
    return (
        <div className="Container">
            <div className="headerContainer">
                <NotificationBell height={25} width={25} fill="#F47738" className={"bell-icon"} />
                <Header >{t("ES_TQM_NOTIFICATIONS")}</Header>
                <a href="#" className="clear-all-link" onClick={handleClearAll}>{t("TQM_CLEAR_SEARCH")}</a>
            </div>
            {notifications.length > 0 &&
                <div className="NotificationItem">
                    <div className="Notification">

                        {notifications.map((item, index) => (
                            <div key={index} className="WhatsNewCard">
                                <div className="NotificationHeader">
                                    <Header>{t(item.header)}</Header>
                                    <CloseSvg onClick={() => handleClearNotification(index)} />
                                </div>
                                <div className="notificationContent">
                                    <div>
                                        <p>{t(item.eventNotificationText)}</p>
                                        <p>{item.timePastAfterEventCreation + ` ${t(item.timeApproxiamationInUnits)}`}</p>
                                    </div>
                                    <div className="button-container">
                                        <button className="notification-button" href={item.actionUrl}>{`${t(item.code)}`}</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>

    );
}

export default Notification;