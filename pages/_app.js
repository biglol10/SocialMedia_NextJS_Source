// import App from "next/app"; not needed in functional comp
import axios from "axios";
import { parseCookies, destroyCookie } from "nookies";
import baseUrl from "../utils/baseUrl";
import { redirectUser } from "../utils/authUser";
import Layout from "../components/Layout/Layout";
import "react-toastify/dist/ReactToastify.css";
import "semantic-ui-css/semantic.min.css";
import "cropperjs/dist/cropper.css";

// When you create _app.js you are overriding the defaults in index.js

function MyApp({ Component, pageProps }) {
  return (
    <Layout {...pageProps}>
      <Component {...pageProps} />
    </Layout>
  );
}

MyApp.getInitialProps = async ({ Component, ctx }) => {
  // appContext is different from ctx in index.js, basically ctx is a property inside an appContext
  // console.log(appContext);
  // const { Component, ctx } = appContext;
  const { token } = parseCookies(ctx); // token because you set [token] in authUser.js
  let pageProps = {};

  // ['/'] check for homepage, if user is trying to access proectedRoutes
  const protectedRoutes =
    ctx.pathname === "/" ||
    ctx.pathname === "/[username]" ||
    ctx.pathname === "/notifications" ||
    ctx.pathname === "/post/[postId]" ||
    ctx.pathname === "/messages" ||
    ctx.pathname === "/search";

  // How it works
  // First of all we are going to pass out the token and then we are creating protected routes
  // So the context has a property pathname
  // and if there is no token user is not logged in and if the user is trying to access protectedRoutes we will not allow it and redirect user to login page
  // else if there is a token we are going to wait for initialProps then we are making request to back-end to get user info
  // we are going to receive user, userFollowStats because we are returning that in auth.js

  if (!token) {
    protectedRoutes && redirectUser(ctx, "/login");
  }
  //
  else {
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    try {
      const res = await axios.get(`${baseUrl}/api/auth`, {
        headers: { Authorization: token },
      });

      const { user, userFollowStats } = res.data;

      if (user) !protectedRoutes && redirectUser(ctx, "/"); // if user and not protectedRoutes (trying to access other than homepage) then redirect user to homepage

      pageProps.user = user;
      pageProps.userFollowStats = userFollowStats;
    } catch (error) {
      destroyCookie(ctx, "token");
      redirectUser(ctx, "/login");
    }
  }

  return { pageProps }; // so this pageProps will automatically be added to props of MyApp class
};

export default MyApp;
