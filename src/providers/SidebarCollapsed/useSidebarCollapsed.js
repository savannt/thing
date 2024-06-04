import { useContext } from "react";
import { SidebarCollapsedContext } from "@/providers/SidebarCollapsed/SidebarCollapsedProvider";

export default function useSidebarCollapsed () {
	const context = useContext(SidebarCollapsedContext);
	if(context === undefined) {
		throw new Error("useSidebarCollapsed must be used within a SidebarCollapsedProvider");
	}
	return context;
}