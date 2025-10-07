// src/components/Articles/ArticleCard.jsx
import React from "react";
import { Card, Image } from "semantic-ui-react";
import { useNavigate } from "react-router-dom";
import styles from "./ArticleCard.module.css";

const ArticleCard = ({ id, title, description, imageUrl }) => {
  const navigate = useNavigate();

  return (
    <Card className={styles.card} onClick={() => navigate(`/articles/${id}`)}>
      <Image
        src={imageUrl}
        ui={false}
        className={styles.image}
        loading="lazy"
        decoding="async"
      />
      <Card.Content className={styles.content}>
        <Card.Header className={styles.header}>{title}</Card.Header>
        <Card.Description>{description}</Card.Description>
      </Card.Content>
    </Card>
  );
};

export default ArticleCard;
