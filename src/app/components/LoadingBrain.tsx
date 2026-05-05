export default function LoadingBrain({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return (
    <>
      <style>{`
        @keyframes lb-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes lb-tilt {
          0%, 30%, 100% { transform: rotate(0deg); }
          45%, 75%      { transform: rotate(-8deg); }
        }
        @keyframes lb-dot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50%      { opacity: 1;   transform: translateY(-5px); }
        }
        @keyframes lb-glow {
          0%, 100% { opacity: 0.2; transform: scaleX(1); }
          50%      { opacity: 0.4; transform: scaleX(1.15); }
        }
        .lb-wrapper {
          animation: lb-float 2.6s ease-in-out infinite;
        }
        .lb-tilt {
          animation: lb-tilt 3.8s ease-in-out infinite;
          transform-origin: center bottom;
          display: inline-block;
        }
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '320px',
        gap: '16px',
        userSelect: 'none',
      }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="lb-wrapper">
            <div className="lb-tilt">
              <img
                src="/cerebrito.png"
                alt="Cargando..."
                style={{
                  width: 200,
                  height: 200,
                  objectFit: 'contain',
                  display: 'block',
                }}
                draggable={false}
              />
            </div>
          </div>
          <div style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 14,
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.25)',
            animation: 'lb-glow 2.6s ease-in-out infinite',
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#7c3aed', margin: 0 }}>
            {mensaje}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: '#8b5cf6',
                  animation: `lb-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
