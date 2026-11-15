import React from 'react';
import { Copy, Radio, Link2 } from 'lucide-react';
import Avatar from './Avatar.jsx';

export default function People({ peers, files, following, onFollow, onInvite, roomId }) {
  const fileName = (id) => files.find((f) => f.id === id)?.name;
  return (
    <div className="side-section">
      <div className="side-head"><span>People <b className="count">{peers.length}</b></span></div>
      <div className="people">
        {peers.map((p) => {
          const where = p.cursor?.file && fileName(p.cursor.file);
          const isF = following === p.clientId;
          return (
            <div key={p.clientId} className={`person ${isF ? 'following' : ''}`}>
              <span className="person-av">
                <Avatar name={p.user.name} color={p.user.color} size={34} />
                <i className="online-dot" />
              </span>
              <div className="person-info">
                <b>{p.user.name}{p.isSelf && <em>you</em>}</b>
                <span>{where ? `${where} · Ln ${p.cursor.line}` : 'Idle'}</span>
              </div>
              {!p.isSelf && (
                <button className={`follow ${isF ? 'on' : ''}`} onClick={() => onFollow(isF ? null : p.clientId)} title="Follow their cursor">
                  <Radio size={12} /> {isF ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="invite">
        <div className="invite-title"><Link2 size={13} /> Invite collaborators</div>
        <p>Anyone with this link can join and edit.</p>
        <button className="invite-link" onClick={onInvite}>
          <code>{`${location.host}/room/${roomId}`}</code><Copy size={13} />
        </button>
      </div>
    </div>
  );
}
