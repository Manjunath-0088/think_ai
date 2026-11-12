import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_CODE_SEQUENCES = [
  `const learner = {\n  name: "you",\n  streak: 12,\n  status: "ready",\n};\n\nconsole.log(\n  \`Initializing neural link... \${learner.name}\`\n);`,
  `async function syncModules() {\n  System.engage(learner.id);\n  const data = await Cortex.dl();\n  return data.compile();\n}\n\nawait syncModules();`,
  `if (System.verify(credentials)) {\n  Session.grantAccess({\n    level: "ADMIN",\n    encryption: "QUANTUM",\n  });\n}\n\n// Access Granted.`,
];

export default function CodeTerminal({ codeSequences = DEFAULT_CODE_SEQUENCES }) {
  const [typedText, setTypedText] = useState('');
  const [sequenceIndex, setSequenceIndex] = useState(0);

  useEffect(() => {
    let currentText = '';
    let charIndex = 0;
    let typingTimeout;
    let pauseTimeout;

    const typeChar = () => {
      const fullText = codeSequences[sequenceIndex];
      if (charIndex < fullText.length) {
        currentText += fullText[charIndex];
        setTypedText(currentText);
        charIndex++;
        typingTimeout = setTimeout(typeChar, Math.random() * 30 + 20); 
      } else {
        pauseTimeout = setTimeout(() => {
          setSequenceIndex((prev) => (prev + 1) % codeSequences.length);
          setTypedText('');
        }, 3000); 
      }
    };

    typingTimeout = setTimeout(typeChar, 500); 

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [sequenceIndex, codeSequences]);

  return (
    <div className="glass-panel p-8 rounded-2xl w-full max-w-lg min-h-[350px] border-t border-l border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-center">
      <div className="absolute top-5 left-5 flex gap-2">
        <span className="dot-1 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
        <span className="dot-2 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        <span className="dot-3 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      </div>

      <div className="mt-6 font-mono text-[13px] lg:text-[14px] leading-8 text-cyan-300 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)] text-left w-full">
        {typedText.split('\n').map((line, i, arr) => (
          <div key={i} className="flex justify-start items-center">
            <span className="w-8 shrink-0 text-gray-600 select-none text-right pr-4">
              {i + 1}
            </span>
            <span className="whitespace-pre text-left">
              {line}
              {i === arr.length - 1 && (
                <span className="cursor-blink ml-1 text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]">
                  ▍
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

CodeTerminal.propTypes = {
  codeSequences: PropTypes.arrayOf(PropTypes.string),
};