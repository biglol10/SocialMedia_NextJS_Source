import axios from "axios";
import baseUrl from "./baseUrl";
import catchErrors from "./catchErrors";
import Router from "next/router";
import cookie from "js-cookie";

export const registerUser = async (
  user,
  profilePicUrl,
  setError,
  setLoading
) => {
  setLoading(true);
  try {
    const res = await axios.post(`${baseUrl}/api/signup`, {
      user,
      profilePicUrl,
    });
    setToken(res.data);
  } catch (error) {
    const errorMsg = catchErrors(error);
    setError(errorMsg);
  }
  setLoading(false);
};

export const loginUser = async (user, setError, setLoading) => {
  try {
    const res = await axios.post(`${baseUrl}/api/auth`, {
      user,
    });
    setToken(res.data);
  } catch (error) {
    const errorMsg = catchErrors(error);
    setError(errorMsg);
  }
  setLoading(false);
};

export const redirectUser = (ctx, location) => {
  if (ctx.req) {
    // ctx.req => /http request object, if(ctx.req) means user is on server-side
    ctx.res.writeHead(302, { Location: location }); // setting location on the server-side, to the location we are passing inside this function
    ctx.res.end();
  } else {
    // user is in client side
    Router.push(location);
  }
};

const setToken = (token) => {
  cookie.set("token", token);
  Router.push("/");
};

export const logoutUser = (email) => {
  cookie.set("userEmail", email);
  cookie.remove("token");
  Router.push("/login");
  Router.reload();
};
