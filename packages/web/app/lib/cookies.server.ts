import { createCookie } from "react-router";

export const themeCookie = createCookie("active_theme", {
  path: "/",
  maxAge: 31536000, // 1 year in seconds
  sameSite: "lax",
  // Note: `secure` attribute is often handled automatically by createCookie
  // based on the request protocol in production, but you can force it:
  // secure: process.env.NODE_ENV === "production",
});

export const modeCookie = createCookie("color_mode", {
  path: "/",
  maxAge: 31536000, // 1 year in seconds
  sameSite: "lax",
  // Note: `secure` attribute is often handled automatically by createCookie
  // based on the request protocol in production, but you can force it:
  // secure: process.env.NODE_ENV === "production",
});

export const sidebarCookie = createCookie("sidebar_state", {
  path: "/",
  maxAge: 604800, // 1 week in seconds
  sameSite: "lax",
  // Note: `secure` attribute is often handled automatically by createCookie
  // based on the request protocol in production, but you can force it:
  // secure: process.env.NODE_ENV === "production",
});
