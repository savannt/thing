import { createContext, useState, useEffect, useContext } from "react";

export const StandaloneContext = createContext(0);

export default function StandaloneProvider ({ children }) {
	const [isStandalone, setIsStandalone] = useState(false);

	useEffect(() => {
		if(window.navigator.standalone) {
			setIsStandalone(true);
		}
	}, []);

	return (
		<StandaloneContext.Provider value={isStandalone}>
			{ children }
		</StandaloneContext.Provider>
	)
}