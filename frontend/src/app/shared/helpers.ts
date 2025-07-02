export function scrollToTop(smooth = true, delay = 50) {
    setTimeout(() => {
      const scroller = (
        document.scrollingElement || 
        document.documentElement || 
        document.body
      ) as HTMLElement;

      scroller.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }, delay);
}