import React, { lazy, useEffect, startTransition } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Navbar from "./layout/Navbar";
import Footer from "./layout/Footer";
import UpgradeAlert from "./layout/UpgradeAlert";
import EmailSignUp from "../pages/Home/EmailSignUp";
import HeroBanner from "../pages/Home/HeroBanner";
import FeaturedSection from "../pages/Home/FeaturedSection";
import useAuth from "../hooks/useAuth";
import { subscribeToNewsletter } from "../api/newsletter";
import { PageSkeleton } from "./AppShell";

function TransitionNavigate({ to, replace = false, state }) {
  const navigate = useNavigate();

  useEffect(() => {
    startTransition(() => {
      navigate(to, { replace, state });
    });
  }, [navigate, replace, state, to]);

  return null;
}

// Lazy-load route pages for code-splitting.
const Login = lazy(() => import("../pages/Authentication/Login"));
const Signup = lazy(() => import("../pages/Authentication/Signup"));
const PostPage = lazy(() => import("../pages/Post/PostPage"));
const FindQuestionPage = lazy(
  () => import("../pages/Questions/FindQuestionPage")
);
const PayPage = lazy(() => import("../pages/Payment/PayPage"));
const PlansPage = lazy(() => import("../pages/Payment/PlansPage"));
const ThemePage = lazy(() => import("../pages/Themes/ThemePage"));
const ArticlesPage = lazy(() => import("../pages/Articles/ArticlesPage"));
const ArticleDetailPage = lazy(
  () => import("../pages/Articles/ArticleDetailPage")
);
const QuestionDetailPage = lazy(
  () => import("../pages/Questions/QuestionDetailPage")
);

export default function App() {
  const { user, premium, loading } = useAuth();

  async function handleEmailSignup(email) {
    await subscribeToNewsletter(email);
  }

  const PageWithChrome = ({ children }) => (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar />
      <div id="upgrade-alert-portal" />
      <div id="ai-editor-portal" />
      <main style={{ flex: 1 }}>{children}</main>
      {!premium && !user && <EmailSignUp onSubmit={handleEmailSignup} />}
      <Footer />
    </div>
  );

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <Routes>
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="/question/:id" element={<QuestionDetailPage />} />

      {/* Home (protected) */}
      <Route
        path="/"
        element={
          <PageWithChrome>
            <HeroBanner />
            <FeaturedSection />
            <UpgradeAlert />
          </PageWithChrome>
        }
      />

      {/* Post (protected) */}
      <Route
        path="/post"
        element={
          user ? (
            <PageWithChrome>
              <PostPage />
            </PageWithChrome>
          ) : (
            <TransitionNavigate to="/login" replace />
          )
        }
      />

      {/* Articles */}
      <Route
        path="/articles"
        element={
          <PageWithChrome>
            <ArticlesPage />
          </PageWithChrome>
        }
      />

      {/* Find Question (protected) */}
      <Route
        path="/question"
        element={
          user ? (
            <PageWithChrome>
              <FindQuestionPage />
            </PageWithChrome>
          ) : (
            <TransitionNavigate to="/login" replace />
          )
        }
      />

      {/* Pay */}
      <Route
        path="/pay"
        element={
          <PageWithChrome>
            <PayPage />
          </PageWithChrome>
        }
      />

      {/* Plans */}
      <Route
        path="/plans"
        element={
          <PageWithChrome>
            <PlansPage />
          </PageWithChrome>
        }
      />

      {/* Theme (premium only) */}
      <Route
        path="/theme"
        element={
          user ? (
            premium ? (
              <PageWithChrome>
                <ThemePage />
              </PageWithChrome>
            ) : (
              <TransitionNavigate to="/plans" replace />
            )
          ) : (
            <TransitionNavigate to="/login" replace />
          )
        }
      />

      {/* Auth */}
      <Route
        path="/login"
        element={user ? <TransitionNavigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <TransitionNavigate to="/" replace /> : <Signup />}
      />

      {/* Catch-all */}
      <Route path="*" element={<TransitionNavigate to="/" replace />} />
    </Routes>
  );
}
