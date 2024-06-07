import { useContext } from "react";
import { StandaloneContext } from "@/providers/Standalone/StandaloneProvider";

export default function useStandalone () {
	const context = useContext(StandaloneContext);
	if(context === undefined) {
		throw new Error("useStandalone must be used within a StandaloneProvider");
	}
	return context;
}