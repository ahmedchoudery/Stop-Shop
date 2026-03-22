import { useEffect } from 'react';

const CustomCursor = () => {
    useEffect(() => {
        const cursor = document.getElementById('custom-cursor');
        const follower = document.getElementById('cursor-follower');

        if (!cursor || !follower) return;

        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;
        let rafId;

        const onMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        };

        const animateFollower = () => {
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;
            follower.style.left = followerX + 'px';
            follower.style.top = followerY + 'px';
            rafId = requestAnimationFrame(animateFollower);
        };

        const onMouseLeave = () => {
            cursor.style.opacity = '0';
            follower.style.opacity = '0';
        };

        const onMouseEnter = () => {
            cursor.style.opacity = '1';
            follower.style.opacity = '1';
        };

        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);
        document.addEventListener('mouseenter', onMouseEnter);
        rafId = requestAnimationFrame(animateFollower);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('mouseenter', onMouseEnter);
            cancelAnimationFrame(rafId);
        };
    }, []);

    return null;
};

export default CustomCursor;