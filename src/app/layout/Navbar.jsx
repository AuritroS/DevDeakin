import React, {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Menu, Input, Icon } from "semantic-ui-react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import PremiumBadge from "../../pages/Home/PremiumBadge";
import styles from "./Navbar.module.css";
import { useRecentPosts, useRecentQuestions } from "../../hooks/useRecent";
import useDelayedFlag from "../../hooks/useDelayedFlag";

const Navbar = () => {
  const { user, premium, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const searchingRaw = searchTerm !== deferredSearch;
  const isSearching = useDelayedFlag(searchingRaw, 150);
  const [open, setOpen] = useState(false);
  const searchRef = useRef(null);

  const { data: recentPosts } = useRecentPosts(10);
  const { data: recentQuestions } = useRecentQuestions(10);

  const suggestions = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) return [];

    const items = [];

    (recentPosts || []).forEach((post) => {
      const title = post.title || "Untitled post";
      const text = `${post.abstract || ""} ${post.body || ""}`.toLowerCase();
      if (
        title.toLowerCase().includes(needle) ||
        text.includes(needle)
      ) {
        items.push({
          id: post.id,
          type: "article",
          title,
          subtitle: post.abstract || post.body?.slice(0, 120) || "",
        });
      }
    });

    (recentQuestions || []).forEach((question) => {
      const title = question.title || "Untitled question";
      const text = `${question.description || ""} ${(question.tags || []).join(" ")}`.toLowerCase();
      if (title.toLowerCase().includes(needle) || text.includes(needle)) {
        items.push({
          id: question.id,
          type: "question",
          title,
          subtitle: question.description?.slice(0, 120) || "",
        });
      }
    });

    return items.slice(0, 6);
  }, [deferredSearch, recentPosts, recentQuestions]);

  useEffect(() => {
    const handler = (evt) => {
      if (!open) return;
      if (searchRef.current && !searchRef.current.contains(evt.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectSuggestion = (item) => {
    setOpen(false);
    setSearchTerm("");
    startTransition(() => {
      if (item.type === "article") navigate(`/articles/${item.id}`);
      else navigate(`/question/${item.id}`);
    });
  };

  const handleLogout = async () => {
    await signOut(); // clears auth & premium in a transition inside the hook
    startTransition(() => {
      navigate("/login", { replace: true });
    });
  };

  return (
    <Menu className={styles.nav} stackable>
      {/* Left */}
      <Menu.Item as={NavLink} to="/" header>
        DEV@Deakin
      </Menu.Item>
      <Menu.Item as={NavLink} to="/question" name="Find Question" />
      <Menu.Item as={NavLink} to="/post" name="Post" />

      {/* Middle: full-length search (grows to fill remaining space) */}
      <Menu.Item className={styles.grow}>
        <div className={styles.searchWrap} ref={searchRef}>
          <Input
            icon="search"
            placeholder="Search articles or questions…"
            fluid
            value={searchTerm}
            loading={isSearching}
            onFocus={() => setOpen(true)}
            onChange={(e, data) => {
              setSearchTerm(data.value);
              if (!open) setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
              if (e.key === "Enter") {
                if (suggestions[0]) {
                  selectSuggestion(suggestions[0]);
                }
              }
            }}
            className={styles.search}
          />

          {open && searchTerm.trim() && (
            <div className={styles.searchDropdown}>
              {isSearching ? (
                <div className={styles.searchHint}>Searching…</div>
              ) : suggestions.length === 0 ? (
                <div className={styles.searchEmpty}>
                  <Icon name="info circle" />
                  <span>No quick matches. Try a different keyword.</span>
                </div>
              ) : (
                suggestions.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className={styles.searchOption}
                  >
                    <span className={styles.searchOptionTitle}>{item.title}</span>
                    <span className={styles.searchOptionMeta}>
                      <Icon
                        name={item.type === "article" ? "file alternate" : "question circle"}
                        size="small"
                      />
                      <span>{item.type === "article" ? "Article" : "Question"}</span>
                    </span>
                    {item.subtitle && (
                      <span className={styles.searchOptionSubtitle}>
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </Menu.Item>

      {/* Right */}
      <Menu.Menu position="right">
        {loading ? (
          <Menu.Item disabled>Loading…</Menu.Item>
        ) : user ? (
          <>
            <Menu.Item
              as={NavLink}
              to={premium ? "/theme" : "/plans"}
              className={`${styles.user} ${premium ? styles.userPremium : styles.userFree}`}
            >
              <span className={styles.userName}>
                {user.displayName || "User"}
              </span>
              {premium && <PremiumBadge />}
            </Menu.Item>

            <Menu.Item name="Logout" onClick={handleLogout} />
          </>
        ) : (
          <Menu.Item as={NavLink} to="/login" name="Login" />
        )}
      </Menu.Menu>
    </Menu>
  );
};

export default Navbar;
