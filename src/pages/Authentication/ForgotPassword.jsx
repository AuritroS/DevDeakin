import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Container,
  Divider,
  Form,
  Header,
  Icon,
  Message,
  Segment,
} from "semantic-ui-react";

import { sendPasswordReset } from "../../api/firebase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError("");
    setNotice("");

    try {
      setSubmitting(true);
      await sendPasswordReset(email.trim());
      setNotice(
        "If an account exists for that email address, we've sent a reset link."
      );
    } catch (err) {
      setError(err?.message || "Unable to send password reset email.");
    } finally {
      setSubmitting(false);
    }
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

      <Header as="h2" content="Reset your password" />
      <p>
        Enter the email address associated with your account and we'll send you
        a link to reset your password.
      </p>

      <Segment>
        <Form loading={submitting} onSubmit={handleSubmit}>
          <Form.Input
            label="Email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e, { value }) => setEmail(value)}
            required
          />

          <Button
            primary
            fluid
            className="btn-primary"
            content="Send reset email"
            disabled={!email.trim()}
          />
        </Form>
      </Segment>

      {error && <Message negative>{error}</Message>}
      {notice && <Message positive>{notice}</Message>}

      <Divider hidden />
      <Message>
        Remembered your password? <Link to="/login">Back to login</Link>
      </Message>
    </Container>
  );
}
