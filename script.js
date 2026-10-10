(() => {
  "use strict";

  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  const readSession = (key) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (_) {
      return null;
    }
  };
  const writeSession = (key, value) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (_) {
      /* storage may be unavailable in a sandbox */
    }
  };

  // A short loading beat: the progress number is decorative, while the content stays usable.
  const preloader = document.getElementById("preloader");
  const loadMeter = document.getElementById("load-meter");
  const loadPercent = document.getElementById("load-percent");
  if (preloader) {
    if (prefersReducedMotion || readSession("goodfield-intro-seen")) {
      preloader.classList.add("is-done");
    } else {
      const started = performance.now();
      const duration = 780;
      const animateLoader = (now) => {
        const progress = Math.min(
          100,
          Math.round(((now - started) / duration) * 100),
        );
        if (loadMeter) loadMeter.style.width = `${progress}%`;
        if (loadPercent)
          loadPercent.textContent = `${String(progress).padStart(2, "0")}%`;
        if (progress < 100) requestAnimationFrame(animateLoader);
        else {
          window.setTimeout(() => {
            preloader.classList.add("is-done");
            writeSession("goodfield-intro-seen", "1");
          }, 100);
        }
      };
      requestAnimationFrame(animateLoader);
    }
  }

  // Reveal-on-scroll, with a visible fallback when IntersectionObserver is unavailable.
  const revealItems = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("in-view"));
  }

  // Live Lahore clock and reading ruler.
  const clockTargets = [
    document.getElementById("studio-clock"),
    document.getElementById("contact-clock"),
    document.getElementById("footer-clock"),
  ].filter(Boolean);
  const updateClock = () => {
    const value = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Karachi",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    clockTargets.forEach((node) => {
      node.textContent = node.id === "footer-clock" ? `${value} PKT` : value;
    });
  };
  updateClock();
  window.setInterval(updateClock, 30000);
  const readingFill = document.getElementById("reading-fill");
  const readingPercent = document.getElementById("reading-percent");
  let progressQueued = false;
  const updateReadingProgress = () => {
    progressQueued = false;
    const maxScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    const percent = Math.max(
      0,
      Math.min(100, Math.round((window.scrollY / maxScroll) * 100)),
    );
    if (readingFill) readingFill.style.width = `${percent}%`;
    if (readingPercent)
      readingPercent.textContent = `${String(percent).padStart(2, "0")}%`;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!progressQueued) {
        progressQueued = true;
        requestAnimationFrame(updateReadingProgress);
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", updateReadingProgress);
  updateReadingProgress();
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile menu. The links close it after selection; Escape closes it too.
  const mobileMenu = document.getElementById("mobile-menu");
  const primaryNav = document.getElementById("primary-nav");
  if (mobileMenu && primaryNav) {
    mobileMenu.addEventListener("click", () => {
      const isOpen = mobileMenu.getAttribute("aria-expanded") === "true";
      mobileMenu.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu.setAttribute(
        "aria-label",
        isOpen ? "Open navigation" : "Close navigation",
      );
      primaryNav.classList.toggle("is-open", !isOpen);
    });
    primaryNav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        mobileMenu.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-label", "Open navigation");
        primaryNav.classList.remove("is-open");
      }),
    );
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        mobileMenu.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-label", "Open navigation");
        primaryNav.classList.remove("is-open");
      }
    });
  }

  // Small hand-drawn cursor cue on mouse/trackpad. Native cursor remains on touch screens.
  const cursor = document.getElementById("cursor-follower");
  if (cursor && finePointer) {
    document.body.classList.add("has-custom-cursor");
    let cursorX = -50;
    let cursorY = -50;
    let targetX = -50;
    let targetY = -50;
    const moveCursor = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.style.opacity = "1";
    };
    window.addEventListener("pointermove", moveCursor, { passive: true });
    const followCursor = () => {
      cursorX += (targetX - cursorX) * 0.26;
      cursorY += (targetY - cursorY) * 0.26;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(followCursor);
    };
    requestAnimationFrame(followCursor);
    document
      .querySelectorAll('a, button, [role="button"]')
      .forEach((element) => {
        element.addEventListener("pointerenter", () =>
          document.body.classList.add("cursor-on-link"),
        );
        element.addEventListener("pointerleave", () =>
          document.body.classList.remove("cursor-on-link"),
        );
      });
  }

  // Gentle magnetism on the two primary orange actions.
  if (finePointer && !prefersReducedMotion) {
    document.querySelectorAll(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.06}px, ${y * 0.09}px)`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.transform = "";
      });
    });
  }

  // Hero constellation: a quiet field of floating points that nods toward the pointer.
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas && heroCanvas.getContext) {
    const ctx = heroCanvas.getContext("2d");
    const hero = heroCanvas.closest(".hero");
    let width = 0;
    let height = 0;
    let dpr = 1;
    let points = [];
    const pointer = { x: -1000, y: -1000, active: false };
    const setCanvasSize = () => {
      const rect = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      heroCanvas.width = Math.round(width * dpr);
      heroCanvas.height = Math.round(height * dpr);
      heroCanvas.style.width = `${width}px`;
      heroCanvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(74, Math.max(32, Math.round(width / 16)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.65 + 0.45,
        warm: Math.random() > 0.84,
      }));
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize, { passive: true });
    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
        pointer.active = true;
      },
      { passive: true },
    );
    hero.addEventListener(
      "pointerleave",
      () => {
        pointer.active = false;
      },
      { passive: true },
    );
    const drawHero = () => {
      ctx.clearRect(0, 0, width, height);
      points.forEach((point, index) => {
        if (!prefersReducedMotion) {
          point.x += point.vx;
          point.y += point.vy;
          if (point.x < -4) point.x = width + 4;
          if (point.x > width + 4) point.x = -4;
          if (point.y < -4) point.y = height + 4;
          if (point.y > height + 4) point.y = -4;
          if (pointer.active) {
            const dx = point.x - pointer.x;
            const dy = point.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < 116 && distance > 0) {
              point.x += (dx / distance) * (116 - distance) * 0.0024;
              point.y += (dy / distance) * (116 - distance) * 0.0024;
            }
          }
        }
        ctx.beginPath();
        ctx.fillStyle = point.warm
          ? "rgba(238,90,40,.48)"
          : "rgba(255,255,255,.82)";
        ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        ctx.fill();
        for (let j = index + 1; j < points.length; j += 1) {
          const other = points[j];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < 76) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,255,255,${(1 - distance / 76) * 0.15})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });
      if (!prefersReducedMotion) requestAnimationFrame(drawHero);
    };
    drawHero();
  }

  // Project rail: arrow controls and mouse dragging (touch stays native).
  const workTrack = document.getElementById("work-track");
  document.querySelectorAll('[data-scroll="work-track"]').forEach((button) => {
    button.addEventListener("click", () => {
      if (!workTrack) return;
      const sign = Number(button.dataset.dir || 1);
      workTrack.scrollBy({
        left: sign * workTrack.clientWidth * 0.82,
        behavior: "smooth",
      });
    });
  });
  if (workTrack) {
    let down = false;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;
    const moveDrag = (event) => {
      if (!down) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 5) dragged = true;
      if (dragged) event.preventDefault();
      workTrack.scrollLeft = startScroll - delta;
    };
    const endDrag = () => {
      if (!down) return;
      down = false;
      window.removeEventListener("pointermove", moveDrag);
      window.setTimeout(() => {
        dragged = false;
      }, 100);
    };
    workTrack.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse") return;
      down = true;
      dragged = false;
      startX = event.clientX;
      startScroll = workTrack.scrollLeft;
      window.addEventListener("pointermove", moveDrag, { passive: false });
      window.addEventListener("pointerup", endDrag, { once: true });
      window.addEventListener("pointercancel", endDrag, { once: true });
    });
    workTrack.addEventListener(
      "click",
      (event) => {
        if (dragged) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true,
    );
  }

  // Service rail: swipe, arrow buttons, pagination dots and desktop vertical-wheel pan.
  const serviceViewport = document.getElementById("service-viewport");
  const serviceTrack = document.getElementById("service-track");
  const serviceCards = serviceTrack
    ? [...serviceTrack.querySelectorAll(".service-card")]
    : [];
  const serviceDots = [...document.querySelectorAll("[data-service-index]")];
  const serviceCount = document.getElementById("service-count");
  let activeService = 0;
  const goToService = (index) => {
    if (!serviceViewport || !serviceCards.length) return;
    activeService = (index + serviceCards.length) % serviceCards.length;
    serviceViewport.scrollTo({
      left: serviceCards[activeService].offsetLeft - serviceTrack.offsetLeft,
      behavior: "smooth",
    });
    updateServiceState();
  };
  const updateServiceState = () => {
    if (!serviceViewport || !serviceCards.length) return;
    const center = serviceViewport.scrollLeft + serviceViewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;
    serviceCards.forEach((card, index) => {
      const cardCenter =
        card.offsetLeft - serviceTrack.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    activeService = closestIndex;
    if (serviceCount)
      serviceCount.textContent = String(activeService + 1).padStart(2, "0");
    serviceDots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeService);
      dot.setAttribute(
        "aria-current",
        index === activeService ? "true" : "false",
      );
    });
  };
  serviceDots.forEach((dot) =>
    dot.addEventListener("click", () =>
      goToService(Number(dot.dataset.serviceIndex)),
    ),
  );
  document
    .querySelectorAll("[data-service-move]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        goToService(activeService + Number(button.dataset.serviceMove)),
      ),
    );
  if (serviceViewport) {
    let serviceScrollQueued = false;
    serviceViewport.addEventListener(
      "scroll",
      () => {
        if (!serviceScrollQueued) {
          serviceScrollQueued = true;
          requestAnimationFrame(() => {
            updateServiceState();
            serviceScrollQueued = false;
          });
        }
      },
      { passive: true },
    );
    serviceViewport.addEventListener(
      "wheel",
      (event) => {
        if (
          window.innerWidth <= 820 ||
          Math.abs(event.deltaY) < Math.abs(event.deltaX)
        )
          return;
        const canMove =
          (event.deltaY > 0 &&
            serviceViewport.scrollLeft + serviceViewport.clientWidth <
              serviceViewport.scrollWidth - 2) ||
          (event.deltaY < 0 && serviceViewport.scrollLeft > 2);
        if (canMove) {
          event.preventDefault();
          serviceViewport.scrollLeft += event.deltaY * 0.9;
        }
      },
      { passive: false },
    );
    serviceViewport.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToService(activeService + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToService(activeService - 1);
      }
    });
  }
  window.addEventListener("resize", updateServiceState, { passive: true });

  // The comparison table pairs each point across both columns on hover/focus.
  const comparison = document.querySelector(".comparison-window");
  if (comparison) {
    const clearPairs = () =>
      comparison
        .querySelectorAll(".is-related")
        .forEach((item) => item.classList.remove("is-related"));
    comparison.querySelectorAll("li[data-pair]").forEach((item) => {
      const activate = () => {
        clearPairs();
        comparison
          .querySelectorAll(`li[data-pair="${item.dataset.pair}"]`)
          .forEach((match) => match.classList.add("is-related"));
      };
      item.addEventListener("pointerenter", activate);
      item.addEventListener("focusin", activate);
    });
    comparison.addEventListener("pointerleave", clearPairs);
    comparison.addEventListener("focusout", (event) => {
      if (!comparison.contains(event.relatedTarget)) clearPairs();
    });
  }

  // A small, keyboard-operable testimonial carousel.
  const notes = [
    {
      initials: "MS",
      name: "Mina S.",
      role: "Founder · sample note",
      color: "avatar--rose",
      text: "“They asked the question we hadn’t quite worked out how to ask ourselves. After that, everything got easier.”",
    },
    {
      initials: "AR",
      name: "Arman R.",
      role: "Co-founder · sample note",
      color: "avatar--blue",
      text: "“The first version felt like us, not like a moodboard someone found on page twelve of Pinterest. That made all the difference.”",
    },
    {
      initials: "LK",
      name: "Leena K.",
      role: "Marketing lead · sample note",
      color: "avatar--peach",
      text: "“Clear, calm and properly collaborative. We finished with a site we’re proud to send people to.”",
    },
  ];
  let noteIndex = 0;
  const quoteText = document.getElementById("quote-text");
  const quoteName = document.getElementById("quote-name");
  const quoteRole = document.getElementById("quote-role");
  const quoteAvatar = document.getElementById("quote-avatar");
  const quotePosition = document.getElementById("quote-position");
  const setNote = (index) => {
    noteIndex = (index + notes.length) % notes.length;
    const note = notes[noteIndex];
    if (quoteText) quoteText.textContent = note.text;
    if (quoteName) quoteName.textContent = note.name;
    if (quoteRole) quoteRole.textContent = note.role;
    if (quotePosition)
      quotePosition.textContent = `${String(noteIndex + 1).padStart(2, "0")} / ${String(notes.length).padStart(2, "0")}`;
    if (quoteAvatar) {
      quoteAvatar.textContent = note.initials;
      quoteAvatar.className = `avatar ${note.color}`;
    }
  };
  document
    .getElementById("quote-prev")
    ?.addEventListener("click", () => setNote(noteIndex - 1));
  document
    .getElementById("quote-next")
    ?.addEventListener("click", () => setNote(noteIndex + 1));

  // Plan selector changes the whole offer in one place.
  const plans = {
    identity: {
      price: "$2,400",
      period: "/ project",
      caption: "A focused identity or digital design sprint.",
      count: "06 THINGS",
      subject: "Let's talk about Brand & Design",
      includes: [
        "Project discovery & direction",
        "One thoughtful design system",
        "Up to 5 core page designs",
        "Responsive layouts",
        "Two rounds of useful refinement",
        "Clear handoff, not a mystery file",
      ],
    },
    full: {
      price: "$4,800",
      period: "/ project",
      caption: "A designed, built and launch-ready digital home.",
      count: "08 THINGS",
      subject: "Let's talk about Design + Build",
      includes: [
        "Everything in Brand & Design",
        "Webflow build & CMS setup",
        "Responsive interactions",
        "Basic technical SEO",
        "Launch-day quality check",
        "One training session for your team",
        "Two thoughtful refinement rounds",
        "Clear handoff and a real human to ask",
      ],
    },
  };
  const planPrice = document.getElementById("plan-price");
  const planPeriod = document.getElementById("plan-period");
  const planCaption = document.getElementById("plan-caption");
  const planIncludes = document.getElementById("plan-includes");
  const includedCount = document.getElementById("included-count");
  const planCta = document.getElementById("plan-cta");
  const choosePlan = (planKey) => {
    const plan = plans[planKey];
    if (!plan) return;
    document.querySelectorAll("[data-plan]").forEach((button) => {
      const selected = button.dataset.plan === planKey;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    if (planPrice) {
      planPrice.classList.add("is-changing");
      window.setTimeout(() => {
        planPrice.textContent = plan.price;
        planPrice.classList.remove("is-changing");
      }, 120);
    }
    if (planPeriod) planPeriod.textContent = plan.period;
    if (planCaption) planCaption.textContent = plan.caption;
    if (includedCount) includedCount.textContent = plan.count;
    if (planIncludes) {
      planIncludes.replaceChildren(
        ...plan.includes.map((label, index) => {
          const li = document.createElement("li");
          li.textContent = label;
          li.style.animationDelay = `${index * 25}ms`;
          return li;
        }),
      );
    }
    if (planCta)
      planCta.href = `mailto:hello@goodfield.studio?subject=${encodeURIComponent(plan.subject)}`;
  };
  document
    .querySelectorAll("[data-plan]")
    .forEach((button) =>
      button.addEventListener("click", () => choosePlan(button.dataset.plan)),
    );

  // FAQ accordions: one open item at a time, with explicit aria-expanded states.
  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const currentItem = button.closest(".faq-item");
      const wasOpen = currentItem.classList.contains("is-open");
      document.querySelectorAll(".faq-item").forEach((item) => {
        item.classList.remove("is-open");
        item
          .querySelector(".faq-question")
          ?.setAttribute("aria-expanded", "false");
        const toggle = item.querySelector(".faq-toggle");
        if (toggle) toggle.textContent = "＋";
      });
      if (!wasOpen) {
        currentItem.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        const toggle = button.querySelector(".faq-toggle");
        if (toggle) toggle.textContent = "−";
      }
    });
  });

  // One reusable dialog keeps case notes and service details in one place.
  const dialog = document.getElementById("detail-dialog");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogLede = document.getElementById("dialog-lede");
  const dialogBody = document.getElementById("dialog-body");
  const dialogKicker = document.getElementById("dialog-kicker");
  const dialogIndex = document.getElementById("dialog-index");
  const dialogTags = document.getElementById("dialog-tags");
  const projectNotes = {
    alma: {
      index: "01 / CASE NOTE",
      title: "A gentler kind of coffee break.",
      lede: "Alma Coffee wanted their online shop to feel like their café: welcoming, unhurried and easy to return to.",
      body: "We brought the packaging, product photography and storefront into one warm visual system. The concept focuses on clear choices and a calmer checkout, with a few playful details tucked around the edges.",
      tags: ["Brand identity", "E-commerce", "Art direction"],
    },
    nara: {
      index: "02 / CASE NOTE",
      title: "Care that sounds like care.",
      lede: "Nara Ritual began with a useful question: could a skincare brand make the daily routine feel less like homework?",
      body: "A softer editorial voice, a simpler product hierarchy and a set of considered packaging cues helped the concept feel reassuring without becoming precious.",
      tags: ["Positioning", "Packaging", "Digital design"],
    },
    fable: {
      index: "03 / CASE NOTE",
      title: "A place to stay a little longer.",
      lede: "Fable House is a small hospitality concept for people who like their weekends slow and their maps a little folded.",
      body: "The identity draws on easy-going travel ephemera. The booking journey is kept short, while the site gives the rooms and the neighbourhood enough space to tell their own story.",
      tags: ["Identity", "Booking flow", "Web design"],
    },
    orbit: {
      index: "04 / CASE NOTE",
      title: "A quieter place for your thoughts.",
      lede: "Orbit Notes is a product-design exercise for making a simple daily note feel like a small exhale.",
      body: "We explored a gentle visual language, one clear action per screen and a prototype that treats an empty state as an invitation rather than a dead end.",
      tags: ["Product direction", "UI design", "Prototype"],
    },
  };
  const serviceNotes = {
    brand: {
      index: "WHAT WE DO / 01",
      title: "A brand that knows what it means.",
      lede: "A clear point of view, translated into a visual system your team can use with confidence.",
      body: "A brand engagement might include a short discovery sprint, positioning, naming support, visual direction, identity design, packaging or a lean set of guidelines. We keep the scope honest and shape it around what you actually need.",
      tags: ["Discovery", "Strategy", "Identity", "Guidelines"],
    },
    web: {
      index: "WHAT WE DO / 02",
      title: "A website people can find their way around.",
      lede: "A considered digital home with a clear story, a useful structure and no mystery navigation.",
      body: "We can help with page architecture, art direction, interface design, responsive layouts, Webflow implementation, simple CMS setup, motion and launch checks. You can bring us in for design only or carry the work through to launch.",
      tags: ["UX", "UI", "Webflow", "Launch"],
    },
    product: {
      index: "WHAT WE DO / 03",
      title: "A product idea made easier to understand.",
      lede: "A prototype is a good way to get a real reaction before you build the whole thing.",
      body: "We map the important moments, design the interface, create a clickable prototype and give the system enough structure to keep growing. Motion is used to clarify, not to show off.",
      tags: ["Product UI", "Prototype", "Motion", "Systems"],
    },
  };
  const storyNotes = {
    alma: projectNotes.alma,
    nara: projectNotes.nara,
    orbit: projectNotes.orbit,
  };
  const openDetails = (kind, key) => {
    if (!dialog) return;
    let data;
    if (kind === "project") data = projectNotes[key];
    else if (kind === "service") data = serviceNotes[key];
    else if (kind === "story") data = storyNotes[key];
    if (!data) return;
    dialogTitle.textContent = data.title;
    dialogLede.textContent = data.lede;
    dialogBody.textContent = data.body;
    dialogIndex.textContent = data.index;
    dialogKicker.textContent =
      kind === "service"
        ? "GOODFIELD / A SMALL MENU"
        : "GOODFIELD / PROJECT NOTES";
    dialogTags.replaceChildren(
      ...data.tags.map((tag) => {
        const span = document.createElement("span");
        span.textContent = tag;
        return span;
      }),
    );
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };
  document.querySelectorAll("[data-dialog]").forEach((trigger) => {
    trigger.addEventListener("click", () =>
      openDetails(
        trigger.dataset.dialog,
        trigger.dataset.project ||
          trigger.dataset.service ||
          trigger.dataset.story,
      ),
    );
  });
  dialog
    ?.querySelector(".dialog-close")
    ?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });

  // Dismissible floating contact invite; the choice lasts for this browser tab.
  const nudge = document.getElementById("contact-nudge");
  const nudgeClose = document.querySelector("[data-dismiss-nudge]");
  if (nudge && readSession("goodfield-nudge-dismissed"))
    nudge.classList.add("is-hidden");
  nudgeClose?.addEventListener("click", () => {
    nudge?.classList.add("is-hidden");
    writeSession("goodfield-nudge-dismissed", "1");
  });

  // Matter.js playground. It starts only after the visitor asks it to.
  const playButton = document.getElementById("play-button");
  const playStage = document.getElementById("play-stage");
  const playCanvas = document.getElementById("play-canvas");
  if (playButton && playStage && playCanvas && window.Matter) {
    const { Engine, Bodies, Body, Composite, Events } = window.Matter;
    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.05;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let boundaries = [];
    let active = false;
    let rafId = 0;
    let burstCount = 0;
    const playCtx = playCanvas.getContext("2d");
    const palette = [
      "#f26b43",
      "#f5c86e",
      "#75b8dc",
      "#91c9a5",
      "#c5afe2",
      "#f3a594",
    ];
    const words = [
      "nice!",
      "oh!",
      "good",
      "✳",
      "well",
      "hello",
      "yep",
      "♥",
      "make",
    ];
    const shapes = [];

    const sizePlayground = () => {
      const rect = playStage.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      playCanvas.width = Math.round(width * dpr);
      playCanvas.height = Math.round(height * dpr);
      playCanvas.style.width = `${width}px`;
      playCanvas.style.height = `${height}px`;
      playCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (boundaries.length)
        boundaries.forEach((boundary) =>
          Composite.remove(engine.world, boundary),
        );
      boundaries = [
        Bodies.rectangle(width / 2, height + 22, width + 120, 44, {
          isStatic: true,
          label: "floor",
        }),
        Bodies.rectangle(-22, height / 2, 44, height + 80, {
          isStatic: true,
          label: "wall",
        }),
        Bodies.rectangle(width + 22, height / 2, 44, height + 80, {
          isStatic: true,
          label: "wall",
        }),
      ];
      Composite.add(engine.world, boundaries);
      shapes.forEach((shape) => {
        if (shape.position.x > width - 15)
          Body.setPosition(shape, { x: width - 25, y: shape.position.y });
      });
    };
    sizePlayground();
    if ("ResizeObserver" in window)
      new ResizeObserver(sizePlayground).observe(playStage);
    else window.addEventListener("resize", sizePlayground, { passive: true });

    const addShape = (x, y, index) => {
      const color = palette[(burstCount + index) % palette.length];
      const text = words[(burstCount + index) % words.length];
      const circle = (burstCount + index) % 4 === 0;
      const w = text.length > 5 ? 70 : 55 + Math.random() * 20;
      const h = 34;
      const body = circle
        ? Bodies.circle(x, y, 20 + Math.random() * 5, {
            restitution: 0.66,
            friction: 0.18,
            density: 0.0018,
          })
        : Bodies.rectangle(x, y, w, h, {
            chamfer: { radius: 8 },
            restitution: 0.52,
            friction: 0.16,
            density: 0.0016,
          });
      body.plugin = body.plugin || {};
      body.plugin.goodfield = { color, text, circle, w, h };
      shapes.push(body);
      Composite.add(engine.world, body);
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 1.2,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
    };

    const roundRect = (context, x, y, w, h, radius) => {
      const r = Math.min(radius, w / 2, h / 2);
      context.beginPath();
      context.moveTo(x + r, y);
      context.arcTo(x + w, y, x + w, y + h, r);
      context.arcTo(x + w, y + h, x, y + h, r);
      context.arcTo(x, y + h, x, y, r);
      context.arcTo(x, y, x + w, y, r);
      context.closePath();
    };
    const renderPlayground = (time) => {
      if (!active) return;
      Engine.update(engine, 1000 / 60);
      playCtx.clearRect(0, 0, width, height);
      shapes.forEach((body) => {
        const meta = body.plugin.goodfield;
        if (!meta) return;
        playCtx.save();
        playCtx.translate(body.position.x, body.position.y);
        playCtx.rotate(body.angle);
        playCtx.shadowColor = "rgba(22,50,67,.17)";
        playCtx.shadowBlur = 9;
        playCtx.shadowOffsetY = 4;
        playCtx.fillStyle = meta.color;
        if (meta.circle) {
          playCtx.beginPath();
          playCtx.arc(0, 0, body.circleRadius || 22, 0, Math.PI * 2);
          playCtx.fill();
        } else {
          roundRect(playCtx, -meta.w / 2, -meta.h / 2, meta.w, meta.h, 8);
          playCtx.fill();
        }
        playCtx.shadowColor = "transparent";
        playCtx.textAlign = "center";
        playCtx.textBaseline = "middle";
        playCtx.fillStyle = "#fffdf7";
        playCtx.font = meta.circle
          ? '700 13px "Hanken Grotesk", sans-serif'
          : '700 11px "Hanken Grotesk", sans-serif';
        playCtx.fillText(meta.text, 0, 1, meta.circle ? 34 : meta.w - 11);
        playCtx.restore();
      });
      // Retire old bodies after they have settled so the demo remains light.
      if (shapes.length > 45) {
        const stale = shapes.splice(0, shapes.length - 45);
        stale.forEach((body) => Composite.remove(engine.world, body));
      }
      rafId = requestAnimationFrame(renderPlayground);
    };
    const startPlayground = () => {
      if (active) return;
      active = true;
      rafId = requestAnimationFrame(renderPlayground);
    };
    playButton.addEventListener("click", () => {
      if (prefersReducedMotion) {
        playStage.classList.add("play-stage--reduced-burst");
        playButton.innerHTML =
          'A little something <span aria-hidden="true">✳</span>';
        return;
      }
      startPlayground();
      burstCount += 1;
      for (let i = 0; i < 9; i += 1) {
        const x = Math.max(
          35,
          Math.min(width - 35, width * (0.18 + Math.random() * 0.64)),
        );
        addShape(x, -18 - Math.random() * 175 - i * 5, i);
      }
      playButton.innerHTML = 'Again? Sure <span aria-hidden="true">✳</span>';
    });
    playCanvas.addEventListener("pointerdown", (event) => {
      if (prefersReducedMotion) return;
      if (!active) startPlayground();
      const rect = playCanvas.getBoundingClientRect();
      addShape(
        event.clientX - rect.left,
        event.clientY - rect.top,
        burstCount++,
      );
    });
    playStage.addEventListener(
      "pointermove",
      (event) => {
        if (!active || event.pointerType === "touch") return;
        const rect = playStage.getBoundingClientRect();
        const px = event.clientX - rect.left;
        const py = event.clientY - rect.top;
        Composite.allBodies(engine.world).forEach((body) => {
          if (body.isStatic) return;
          const dx = body.position.x - px;
          const dy = body.position.y - py;
          const distance = Math.hypot(dx, dy);
          if (distance < 52 && distance > 4) {
            Body.applyForce(body, body.position, {
              x: (dx / distance) * 0.000018,
              y: (dy / distance) * 0.000018,
            });
          }
        });
      },
      { passive: true },
    );
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rafId) cancelAnimationFrame(rafId);
      else if (!document.hidden && active)
        rafId = requestAnimationFrame(renderPlayground);
    });
  } else if (playButton) {
    playButton.addEventListener("click", () => {
      playButton.innerHTML =
        'That was something <span aria-hidden="true">✳</span>';
      playStage?.classList.add("play-stage--fallback");
    });
  }
})();
