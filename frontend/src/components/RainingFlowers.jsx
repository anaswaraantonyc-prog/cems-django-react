import { useMemo } from "react";

export default function RainingFlowers({ color = "#80283C", count = 48 }) {
  const items = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      type: i % 2 === 0 ? "petal" : "blossom", // Only small flowers and petals
      left: Math.floor(Math.random() * 96) + 2,
      size: i % 2 === 0 ? Math.floor(Math.random() * 8) + 12 : Math.floor(Math.random() * 10) + 14,
      duration: (Math.random() * 2.5 + 2.5).toFixed(1), // 2.5s - 5.0s falling speed
      delay: (Math.random() * 4.0).toFixed(1),
      opacity: (Math.random() * 0.45 + 0.45).toFixed(2),
      isRoseColor: i % 3 === 0,
    }));
  }, [count]);

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      zIndex: 1, overflow: "hidden"
    }}>
      {items.map(f => {
        const itemColor = f.isRoseColor ? "#A8324A" : color;
        return (
          <div
            key={f.id}
            style={{
              position: "absolute",
              left: `${f.left}%`,
              top: "-30px",
              width: f.size,
              height: f.size,
              animation: `rainFlowers ${f.duration}s linear infinite`,
              animationDelay: `${f.delay}s`,
              opacity: f.opacity,
            }}
          >
            {f.type === "blossom" ? (
              /* Cute Small Flower Blossom */
              <svg width={f.size} height={f.size} viewBox="0 0 56 56" fill={itemColor}>
                <g transform="translate(28, 28)">
                  <path d="M0 -22 C-6 -30 6 -30 0 -22" fill={itemColor} />
                  <path d="M15 -15 C25 -22 22 -5 15 -15" fill={itemColor} />
                  <path d="M22 0 C30 -6 30 6 22 0" fill={itemColor} />
                  <path d="M15 15 C22 25 5 22 15 15" fill={itemColor} />
                  <path d="M0 22 C6 30 -6 30 0 22" fill={itemColor} />
                  <path d="-15 15 C-25 22 -22 5 -15 15" fill={itemColor} />
                  <path d="-22 0 C-30 6 -30 -6 -22 0" fill={itemColor} />
                  <path d="-15 -15 C-22 -25 -5 -22 -15 -15" fill={itemColor} />
                  <circle cx="0" cy="0" r="4" fill="#D4AF37" />
                </g>
              </svg>
            ) : (
              /* Delicate Falling Petal */
              <svg width={f.size} height={f.size} viewBox="0 0 24 24" fill={itemColor}>
                <path d="M12 2 C18 6 20 16 12 22 C4 16 6 6 12 2 Z" opacity="0.9" />
              </svg>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes rainFlowers {
          0% {
            transform: translateY(-30px) translateX(0px) rotate(0deg);
          }
          50% {
            transform: translateY(50vh) translateX(15px) rotate(180deg);
          }
          100% {
            transform: translateY(105vh) translateX(-10px) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
