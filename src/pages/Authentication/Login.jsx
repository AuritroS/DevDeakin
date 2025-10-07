import React, { useState, startTransition } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Header,
  Form,
  Button,
  Segment,
  Message,
  Divider,
  Icon,
} from "semantic-ui-react";
import {
  signInWithGooglePopup,
  createUserDocFromAuth,
  signInAuthUserWithEmailAndPassword,
} from "../../api/firebase";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e, { name, value }) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    setFormError("");
    try {
      setSubmitting(true);
      await signInAuthUserWithEmailAndPassword(form.email, form.password);
      startTransition(() => {
        navigate("/", { replace: true });
      });
    } catch (err) {
      setFormError(err?.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setFormError("");
    try {
      setSubmitting(true);
      const { user } = await signInWithGooglePopup();
      await createUserDocFromAuth(user);
      startTransition(() => {
        navigate("/", { replace: true });
      });
    } catch (err) {
      setFormError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    startTransition(() => {
      navigate("/forgot-password");
    });
  };

  return (
    <Container text>
      <Button
        labelPosition="left"
        onClick={() => navigate("/")}
        style={{ marginTop: 48 }}
      >
        <Icon name="arrow left" /> Home
      </Button>
      <Header as="h2" content="Login" />

      <Segment>
        <Form onSubmit={handleLogin} loading={submitting}>
          <Form.Input
            label="Email"
            placeholder="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Form.Input
            label="Password"
            placeholder="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <Form.Field style={{ textAlign: "right", marginTop: "-6px" }}>
            <Button
              type="button"
              size="small"
              basic
              onClick={handleForgotPassword}
            >
              Forgot password?
            </Button>
          </Form.Field>

          <Button primary fluid content="Login" className="btn-primary" />

          <Divider horizontal>or</Divider>

          <Button type="button" fluid onClick={handleGoogle}>
            <Icon name="google" />
            Login with Google
          </Button>
        </Form>
      </Segment>

      {formError && <Message negative>{formError}</Message>}

      <Message>
        Don’t have an account? <Link to="/signup">Sign up</Link>
      </Message>
    </Container>
  );
};

export default Login;
