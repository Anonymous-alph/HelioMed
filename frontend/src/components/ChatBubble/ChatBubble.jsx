import styles from './ChatBubble.module.css';

export default function ChatBubble({
  message,
  isBot = false,
  timestamp,
  avatar
}) {
  const formatMessage = (text) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <div className={`${styles.message} ${isBot ? styles.botMessage : styles.userMessage}`}>
      <div className={styles.messageAvatar}>
        {avatar || (isBot ? '🤖' : '👤')}
      </div>
      <div className={styles.messageContent}>
        <div
          className={styles.messageBubble}
          dangerouslySetInnerHTML={{ __html: formatMessage(message) }}
        />
        <span className={styles.messageTime}>{time}</span>
      </div>
    </div>
  );
}
