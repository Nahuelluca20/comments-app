import {type AppType} from "next/app";
import {Toaster} from "react-hot-toast";
import {ClerkProvider} from "@clerk/nextjs";
import Head from "next/head";

import {api} from "~/utils/api";
import "~/styles/globals.css";

const MyApp: AppType = ({Component, pageProps}) => {
  return (
    <ClerkProvider {...pageProps}>
      <Head>
        <title>Comments Emoji 😁</title>
        <meta content="comments emoji 💭" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <Toaster position="bottom-center" />
      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
