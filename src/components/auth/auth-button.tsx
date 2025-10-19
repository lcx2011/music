import type { FormEvent, SVGProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { UserCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { AnimatePresence, motion } from "framer-motion";

import type { AuthUser } from "@/types/auth";
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  setStoredAuthUser,
} from "@/utils/authStorage";

const EyeSlashFilledIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.2714 9.17834C20.9814 8.71834 20.6714 8.28834 20.3514 7.88834C19.9814 7.41834 19.2814 7.37834 18.8614 7.79834L15.8614 10.7983C16.0814 11.4583 16.1214 12.2183 15.9214 13.0083C15.5714 14.4183 14.4314 15.5583 13.0214 15.9083C12.2314 16.1083 11.4714 16.0683 10.8114 15.8483C10.8114 15.8483 9.38141 17.2783 8.35141 18.3083C7.85141 18.8083 8.01141 19.6883 8.68141 19.9483C9.75141 20.3583 10.8614 20.5683 12.0014 20.5683C13.7814 20.5683 15.5114 20.0483 17.0914 19.0783C18.7014 18.0783 20.1514 16.6083 21.3214 14.7383C22.2714 13.2283 22.2214 10.6883 21.2714 9.17834Z"
        fill="currentColor"
      />
      <path
        d="M14.0206 9.98062L9.98062 14.0206C9.47062 13.5006 9.14062 12.7806 9.14062 12.0006C9.14062 10.4306 10.4206 9.14062 12.0006 9.14062C12.7806 9.14062 13.5006 9.47062 14.0206 9.98062Z"
        fill="currentColor"
      />
      <path
        d="M18.25 5.74969L14.86 9.13969C14.13 8.39969 13.12 7.95969 12 7.95969C9.76 7.95969 7.96 9.76969 7.96 11.9997C7.96 13.1197 8.41 14.1297 9.14 14.8597L5.76 18.2497H5.75C4.64 17.3497 3.62 16.1997 2.75 14.8397C1.75 13.2697 1.75 10.7197 2.75 9.14969C3.91 7.32969 5.33 5.89969 6.91 4.91969C8.49 3.95969 10.22 3.42969 12 3.42969C14.23 3.42969 16.39 4.24969 18.25 5.74969Z"
        fill="currentColor"
      />
      <path
        d="M14.8581 11.9981C14.8581 13.5681 13.5781 14.8581 11.9981 14.8581C11.9381 14.8581 11.8881 14.8581 11.8281 14.8381L14.8381 11.8281C14.8581 11.8881 14.8581 11.9381 14.8581 11.9981Z"
        fill="currentColor"
      />
      <path
        d="M21.7689 2.22891C21.4689 1.92891 20.9789 1.92891 20.6789 2.22891L2.22891 20.6889C1.92891 20.9889 1.92891 21.4789 2.22891 21.7789C2.37891 21.9189 2.56891 21.9989 2.76891 21.9989C2.96891 21.9989 3.15891 21.9189 3.30891 21.7689L21.7689 3.30891C22.0789 3.00891 22.0789 2.52891 21.7689 2.22891Z"
        fill="currentColor"
      />
    </svg>
  );
};

const EyeFilledIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <path
        d="M21.25 9.14969C18.94 5.51969 15.56 3.42969 12 3.42969C10.22 3.42969 8.49 3.94969 6.91 4.91969C5.33 5.89969 3.91 7.32969 2.75 9.14969C1.75 10.7197 1.75 13.2697 2.75 14.8397C5.06 18.4797 8.44 20.5597 12 20.5597C13.78 20.5597 15.51 20.0397 17.09 19.0697C18.67 18.0897 20.09 16.6597 21.25 14.8397C22.25 13.2797 22.25 10.7197 21.25 9.14969ZM12 16.0397C9.76 16.0397 7.96 14.2297 7.96 11.9997C7.96 9.76969 9.76 7.95969 12 7.95969C14.24 7.95969 16.04 9.76969 16.04 11.9997C16.04 14.2297 14.24 16.0397 12 16.0397Z"
        fill="currentColor"
      />
      <path
        d="M11.9984 9.14062C10.4284 9.14062 9.14844 10.4206 9.14844 12.0006C9.14844 13.5706 10.4284 14.8506 11.9984 14.8506C13.5684 14.8506 14.8584 13.5706 14.8584 12.0006C14.8584 10.4306 13.5684 9.14062 11.9984 9.14062Z"
        fill="currentColor"
      />
    </svg>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type AuthErrors = Record<string, string>;

type AuthStatus = {
  user: AuthUser | null;
};

type AuthButtonProps = {
  className?: string;
};

const AuthButton = ({ className }: AuthButtonProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [errors, setErrors] = useState<AuthErrors>({});
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ user: null });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
  const isEmailValid = emailRegex.test(email.trim());
  const showPasswordField = isEmailValid;

  const passwordError = useMemo(() => {
    if (!password) {
      return undefined;
    }
    if (password.length < 6) {
      return "密码至少 6 位";
    }
    return undefined;
  }, [password]);

  useEffect(() => {
    if (!showPasswordField) {
      setPassword("");
      setErrors((prev) => {
        if (!prev.password) {
          return prev;
        }
        const { password: _passwordError, ...rest } = prev;
        return rest;
      });
      setNeedsRegistration(false);
      setNickname("");
      setServerError(null);
    }
  }, [showPasswordField]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current) {
        return;
      }
      if (event.target instanceof Node && wrapperRef.current.contains(event.target)) {
        return;
      }
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    const stored = getStoredAuthUser();

    if (!stored?.email) {
      return;
    }

    setAuthStatus({ user: stored });
    setEmail(stored.email);

    const controller = new AbortController();
    const restore = async () => {
      try {
        const url = new URL(`/api/users/${encodeURIComponent(stored.email)}`, API_BASE_URL).toString();
        const response = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to restore session: ${response.status}`);
        }

        const payload = (await response.json()) as { user?: AuthUser };

        if (payload?.user) {
          setAuthStatus({ user: payload.user });
          setEmail(payload.user.email ?? "");
          setStoredAuthUser(payload.user);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Failed to refresh auth session", error);
        clearStoredAuthUser();
        setAuthStatus({ user: null });
        setEmail("");
      }
    };

    void restore();

    return () => {
      controller.abort();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries()) as Record<string, string>;

    const nextErrors: AuthErrors = {};
    if (!data.email) {
      nextErrors.email = "请输入邮箱";
    }
    if (!data.password) {
      nextErrors.password = "请输入密码";
    } else if (passwordError) {
      nextErrors.password = passwordError;
    }
    if (needsRegistration && (!data.nickname || data.nickname.trim().length === 0)) {
      nextErrors.nickname = "请输入昵称";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setServerError(null);
    setLoading(true);

    const loginUrl = new URL("/api/auth/login", API_BASE_URL).toString();
    const registerUrl = new URL("/api/auth/register", API_BASE_URL).toString();

    const handleSuccess = (user: AuthUser) => {
      setAuthStatus({ user });
      setServerError(null);
      setNeedsRegistration(false);
      setNickname("");
      setLoading(false);
      setPasswordVisible(false);
      setOpen(false);
      setMenuOpen(false);
      setEmail(user.email);
      setPassword("");
      setStoredAuthUser(user);
    };

    try {
      if (needsRegistration) {
        const response = await fetch(registerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            nickname: data.nickname?.trim() ?? "",
          }),
        });

        let payload: unknown;
        try {
          payload = await response.json();
        } catch (error) {
          payload = null;
        }

        if (!response.ok) {
          const message =
            (payload && typeof payload === "object" && "error" in payload &&
              typeof payload.error === "string"
              ? payload.error
              : null) ?? "注册失败";
          throw new Error(message);
        }

        if (
          payload &&
          typeof payload === "object" &&
          "user" in payload &&
          payload.user &&
          typeof payload.user === "object"
        ) {
          handleSuccess(payload.user as AuthUser);
        }
      } else {
        const response = await fetch(loginUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        let payload: unknown;
        try {
          payload = await response.json();
        } catch (error) {
          payload = null;
        }

        const message =
          (payload && typeof payload === "object" && "error" in payload &&
            typeof payload.error === "string"
            ? payload.error
            : null) ?? "登录失败";

        if (!response.ok) {
          const needsRegister =
            response.status === 404 ||
            (payload && typeof payload === "object" && "needsRegistration" in payload
              ? Boolean(payload.needsRegistration)
              : false) ||
            message.includes("请先注册") ||
            message.includes("用户不存在") ||
            message.toLowerCase().includes("username and password");

          if (needsRegister) {
            setNeedsRegistration(true);
            setServerError(message);
            return;
          }

          throw new Error(message);
        }

        if (
          payload &&
          typeof payload === "object" &&
          "user" in payload &&
          payload.user &&
          typeof payload.user === "object"
        ) {
          handleSuccess(payload.user as AuthUser);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "请求失败，请稍后重试";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`relative ${className ?? ""}`} ref={wrapperRef}>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white/10"
          type="button"
          onClick={() => {
            if (authStatus.user) {
              setMenuOpen((value) => !value);
              return;
            }
            setMenuOpen(false);
            setOpen(true);
          }}
        >
          {authStatus.user ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {authStatus.user.nickname?.slice(0, 2) ?? "我"}
            </span>
          ) : (
            <UserCircleIcon className="h-9 w-9 text-gray-500" />
          )}
        </button>
        {menuOpen ? (
          <div className="absolute right-0 mt-3 w-40 rounded-xl bg-zinc-900/95 p-2 text-sm text-white shadow-xl ring-1 ring-white/10"
          >
            <div className="px-3 pb-2 text-xs text-white/60">{authStatus.user?.email}</div>
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white transition hover:bg-white/10"
              type="button"
              onClick={() => {
                setAuthStatus({ user: null });
                setMenuOpen(false);
                setEmail("");
                setPassword("");
                setNickname("");
                setNeedsRegistration(false);
                setServerError(null);
                setErrors({});
                setPasswordVisible(false);
                setOpen(false);
                clearStoredAuthUser();
              }}
            >
              退出登录
            </button>
          </div>
        ) : null}
      </div>
      {open ? (
        <div
          aria-modal="true"
          className="dark fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pb-10 pt-20"
          role="dialog"
          onClick={() => {
            setOpen(false);
            setPassword("");
            setErrors({});
            setNeedsRegistration(false);
            setNickname("");
            setServerError(null);
            setLoading(false);
            setPasswordVisible(false);
            setMenuOpen(false);
            clearStoredAuthUser();
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-zinc-900 p-6 shadow-2xl backdrop-blur"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-6">
              <div className="flex justify-end">
                <button
                  aria-label="关闭"
                  className="rounded-full p-1 text-white/70 transition hover:bg-white/10"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPassword("");
                    setErrors({});
                    setNeedsRegistration(false);
                    setNickname("");
                    setServerError(null);
                    setLoading(false);
                    setPasswordVisible(false);
                    setMenuOpen(false);
                  }}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2 text-center">
                <div className="text-3xl font-semibold text-white">登录或注册</div>
                <p className="mt-2 text-sm text-white/60">使用邮箱登录或创建新账户，继续体验音乐服务</p>
              </div>
            </div>
            <Form
              className="flex flex-col gap-6"
              validationErrors={errors}
              onSubmit={(event) => {
                void handleSubmit(event);
              }}
            >
              <Input
                isRequired
                errorMessage={errors.email}
                label="电子邮箱地址"
                name="email"
                type="email"
                value={email}
                onValueChange={setEmail}
              />
              <AnimatePresence initial={false} mode="wait">
                {showPasswordField ? (
                  <motion.div
                    key="password-field"
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -12, height: 0 }}
                    initial={{ opacity: 0, y: -12, height: 0 }}
                    className="w-full"
                    style={{ overflow: "hidden" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Input
                      isRequired
                      endContent={
                        <button
                          aria-label="切换密码可见"
                          className="focus:outline-none"
                          type="button"
                          onClick={() => {
                            setPasswordVisible((value) => !value);
                          }}
                        >
                          {passwordVisible ? (
                            <EyeSlashFilledIcon className="pointer-events-none text-2xl text-default-400" />
                          ) : (
                            <EyeFilledIcon className="pointer-events-none text-2xl text-default-400" />
                          )}
                        </button>
                      }
                      errorMessage={errors.password ?? passwordError}
                      isInvalid={Boolean(errors.password ?? passwordError)}
                      label="密码"
                      name="password"
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onValueChange={setPassword}
                      variant="bordered"
                    />
                  </motion.div>
                ) : null}
                {needsRegistration ? (
                  <motion.div
                    key="nickname-field"
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 12, height: 0 }}
                    initial={{ opacity: 0, y: 12, height: 0 }}
                    className="w-full"
                    style={{ overflow: "hidden" }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <Input
                      isRequired
                      errorMessage={errors.nickname}
                      label="设置昵称"
                      name="nickname"
                      placeholder="请输入昵称"
                      value={nickname}
                      onValueChange={setNickname}
                      variant="bordered"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <Button
                className="mt-2 w-full bg-white/10 text-white hover:bg-white/15"
                disableRipple={true}
                isDisabled={!showPasswordField || loading}
                isLoading={loading}
                radius="lg"
                size="lg"
                type="submit"
                variant="shadow"
              >
                继续
              </Button>
              {serverError ? (
                <div className="text-sm text-red-400">{serverError}</div>
              ) : null}
            </Form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AuthButton;
