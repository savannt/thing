import { createContext, useState, useEffect, useContext } from "react";

export const MobileContext = createContext(0);

export default function MobileProvider ({ children }) {
	const MOBILE_BREAKPOINT = 800;
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const handleResize = () => {
			if(window.innerWidth < MOBILE_BREAKPOINT) {
				setIsMobile(true);
			} else {
				setIsMobile(false);
			}
		}

		handleResize();

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		}
	}, []);

	return (
		<MobileContext.Provider value={isMobile}>
			{ children }
		</MobileContext.Provider>
	)
}