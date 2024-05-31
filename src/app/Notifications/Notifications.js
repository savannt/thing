import styles from "@/app/Notifications/Notifications.module.css";

import NotificationCard from "@/app/Notifications/NotificationCard";

import { useState, useEffect } from "react";

function NotificationsLayer ({ children }) {
		return (
				<div className={styles.NotificationsLayer}>
						{ children }
				</div>
		)
}

export default function Notifications({ }) {
		const [errors, setErrors] = useState([]);
		const [notifications, setNotifications] = useState([]);
		
		useEffect(() => {
				const handleStorageChange = () => {
						if(window.localStorage.getItem("error")) {
								const error = window.localStorage.getItem("error");
								const timeout = 5000;
								const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		
								let newError = {
										text: error,
										color: "red",
										timeout,
										id,
								};
		
								// Use a functional update to ensure you're working with the most current state
								setErrors(errors => [...errors, newError]);
		

								// remove error from localstorage
								window.localStorage.removeItem("error");
						}
						if(window.localStorage.getItem("notification")) {
								// if there is another notification with same text that was created within the last 5 seconds, don't show it
								const DUPLICATE_THRESHOLD = 500;
								let duplicate = false;
								for(let i = 0; i < notifications.length; i++) {
										// console.log("NOTSIZE", notifications[i].length);
										if(notifications[i].text === window.localStorage.getItem("notification")) {
												duplicate = true;
												break;
										}
								}

								const notificationStr = window.localStorage.getItem("notification");
								const { title, description, color } = JSON.parse(notificationStr);
								const timeout = 5000;
								const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
								
								let newNotification = {
										title,
										description,
										color,
										timeout,
										id,
										time: Date.now(),
								};
		
								// Use a functional update to ensure you're working with the most current state
								setNotifications(notifications => [...notifications, newNotification]);
		

								// remove notification from localstorage
								window.localStorage.removeItem("notification");
						}
				};
		
				if(window) window.addEventListener("storage", handleStorageChange);
		
				// Return a cleanup function to remove the event listener
				return () => {
						if(window) {
								window.removeEventListener("storage", handleStorageChange);
						}
				};
		}, [setNotifications, setErrors]); 

		
		return (
				<NotificationsLayer>
						{ errors.map((error, index) => {
								return (
										<NotificationCard color={error.color} timeout={error.timeout} key={index} onTimeout={() => {
												setErrors(errors.filter((e) => e.id !== error.id));
										}}>
												<p>There was an error. <i>({error.text})</i></p>
										</NotificationCard>
								)
						}) }

						{ notifications.map((notification, index) => {
								return (
										<NotificationCard color={notification.color} timeout={notification.timeout} key={index} onTimeout={() => {
												setNotifications(notifications.filter((n) => n.id !== notification.id));
										}}>
												{notification.title && <h3>{notification.title}</h3> }
												{ notification.description && <p>{notification.description}</p> }
										</NotificationCard>
								)
						}) }
				</NotificationsLayer>
		)
}