import { useEffect, useRef } from 'react';
import styles from './CustomCursor.module.css';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const followerRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;

    const handleMouseMove = (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      follower.style.left = e.clientX + 'px';
      follower.style.top = e.clientY + 'px';
    };

    const handleMouseEnter = () => {
      cursor.classList.add(styles.active);
      follower.classList.add(styles.active);
    };

    const handleMouseLeave = () => {
      cursor.classList.remove(styles.active);
      follower.classList.remove(styles.active);
    };

    document.addEventListener('mousemove', handleMouseMove);

    const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, .clickable');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className={styles.cursor}></div>
      <div ref={followerRef} className={styles.cursorFollower}></div>
    </>
  );
}
