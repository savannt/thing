import {
    Source_Code_Pro,
    Figtree,
    Comfortaa
} from "next/font/google";
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });
const figtree = Figtree({ subsets: ["latin"] });
const comfortaa = Comfortaa({ subsets: ["latin"] });


import * as Ably from "ably";
import { AblyProvider } from "ably/react";

// strict mode
export const strictMode = false;

import { ClerkProvider } from "@clerk/nextjs";
import MobileProvider from "@/providers/Mobile/MobileProvider";
import SidebarCollapsedProvider from "@/providers/SidebarCollapsed/SidebarCollapsedProvider";
import { ReactFlowProvider } from "reactflow";
import StandaloneProvider from "@/providers/Standalone/StandaloneProvider";


const ably = new Ably.Realtime.Promise(`xdpTHA._Un85w:q_V6S2E3SGvDyH3Aop7wBmPMOuAlbx9vgNNGD3kJaB0`);

export default function App ({ Component, pageProps }) {
    return (
        <ReactFlowProvider>
            <ClerkProvider>
                <AblyProvider client={ably}>
                    <SidebarCollapsedProvider>
                        <MobileProvider>
                            <StandaloneProvider>
                                <main className={`${comfortaa.className} ${sourceCodePro.className} ${figtree.className}`} style={{
                                    height: "100dvh",
                                    maxHeight: "100dvh",
                                    minHeight: "100dvh",
                                    width: "100dvw",
                                    maxWidth: "100dvw",
                                    minWidth: "100dvw",
                                    overflow: "hidden",
                                    display: "flex",
                                }}>
                                    <Component {...pageProps} />
                                </main>
                            </StandaloneProvider>
                        </MobileProvider>
                    </SidebarCollapsedProvider>
                </AblyProvider>
            </ClerkProvider>
        </ReactFlowProvider>
    )
}