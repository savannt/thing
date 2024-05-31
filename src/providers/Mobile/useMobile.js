import { useContext } from "react";
import { MobileContext } from "@/providers/Mobile/MobileProvider";

export default function useMobile () {
		const context = useContext(MobileContext);
		if(context === undefined) {
				throw new Error("useMobile must be used within a MobileProvider");
		}
		return context;
}