import { useRef } from 'react';
import './DetailField.css';

/** A validation message that opens and closes rather than popping. It stays mounted,
    holding its last text through the close, and takes no space while shut. */
export function FieldError({ message }: { message: string | null }) {
  const last = useRef(message);
  if (message) last.current = message;
  return (
    <div className="fieldError" data-open={message ? 'on' : 'off'}>
      <div className="fieldError__clip">
        <p className="detailField__error" role={message ? 'alert' : undefined}>{last.current}</p>
      </div>
    </div>
  );
}
