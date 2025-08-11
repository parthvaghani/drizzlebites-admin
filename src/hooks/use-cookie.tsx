import Cookies from 'js-cookie';

type CookieOptions = Cookies.CookieAttributes;

export const setCookie = (
  key: string,
  value: string,
  options: CookieOptions = {}
) => {
  Cookies.set(key, value, options);
};

export const getCookie = (key: string): string | undefined => {
  return Cookies.get(key);
};

export const removeCookie = (
  key: string,
  options?: CookieOptions
) => {
  Cookies.remove(key, options);
};
