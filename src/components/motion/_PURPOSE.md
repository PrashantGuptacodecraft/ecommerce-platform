# Reusable motion primitives (motion/react)
FadeIn, SlideUp, StaggerContainer, StaggerItem, ScaleOnHover, PageTransition,
AnimatedDrawer, AnimatedModal, AnimatedCartItem, AnimatedCounter, RevealOnScroll.
Every primitive must respect prefers-reduced-motion via a shared hook.
No component outside this folder should invent its own raw motion values --
compose these primitives instead.
