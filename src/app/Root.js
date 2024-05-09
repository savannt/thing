import Head from "next/head";

import App from "@/app/App";

export default function Root({ page }) {

    const motd = [
        `𝗧𝗵𝗶𝗻𝗴-𝗸𝗶𝗻𝗴: The supreme king of things, doing thingy things with other things to make things happen. Get your thing on with Thing-king and let the thing-power revolutionize the thingiverse in your organization today! 🚀`,
    ]


    return (
        <>
            <Head>
                <title>𝘁𝗵𝗶𝗻𝗴𝑘𝑖𝑛𝑔</title>
                <meta name="description" content={motd[0]} />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                                
                <link rel="icon" href="/favicon.ico" />
                <link rel="icon" href="/icon.png" type="image/png" sizes="256x256" />
                <link rel="apple-touch-icon" href="/icon.png" type="image/png" sizes="256x256" />
            </Head>
            <App page={page} />
        </>
    )
}