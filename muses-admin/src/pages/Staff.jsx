import React, { useState, useEffect, useRef } from "react";
import Icon from "../Icons";
import {
  useSavedState,
  uid,
  matches,
  Badge,
  Empty,
  Field,
  Panel,
  Modal,
  Header,
  TextButton,
} from "./shared";
const staffSeed = [
  {
    id: "s1",
    name: "Anh Thư",
    email: "anhthu@muses.example",
    role: "Administrator",
    active: true,
  },
  {
    id: "s2",
    name: "Minh Anh",
    email: "minhanh@muses.example",
    role: "Curator",
    active: true,
  },
  {
    id: "s3",
    name: "Gia Hân",
    email: "giahan@muses.example",
    role: "Editor",
    active: true,
  },
];
export default function Staff({ search, toast }) {
  const [staff, setStaff] = useSavedState("muses-admin-staff", staffSeed),
    [edit, setEdit] = useState(null),
    [error, setError] = useState("");
  return (
    <>
      <Header
        title="Good people. Shared purpose."
        description="A local preview of the team behind the visitor experience."
        action={
          <button
            className="primary"
            onClick={() => {
              setError("");
              setEdit({});
            }}
          >
            <Icon name="plus" />
            Add staff record
          </button>
        }
      />
      <div className="pg-notice">
        <Icon name="people" size={18} />
        Role settings are a prototype. They do not grant real access or send
        invitations.
      </div>
      <Panel
        title="Your museum team"
        subtitle={`${staff.filter((s) => s.active).length} active team records`}
      >
        <div className="pg-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {staff
                .filter((s) => matches(s, search))
                .map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <div className="pg-person-cell">
                        <span className={`pg-initial color-${i % 4}`}>
                          {s.name
                            .split(" ")
                            .map((x) => x[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{s.role}</td>
                    <td>
                      <Badge>{s.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td>
                      <TextButton
                        onClick={() => {
                          setError("");
                          setEdit(s);
                        }}
                      >
                        Manage
                      </TextButton>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!staff.some((s) => matches(s, search)) && <Empty />}
      </Panel>
      <Panel
        title="A role for every responsibility"
        subtitle="Proposed permission model; backend enforcement is not implemented."
      >
        <div className="pg-role-grid">
          {[
            ["Administrator", "Full workspace administration", "yellow"],
            ["Curator", "Artworks, artists and exhibitions", "pink"],
            ["Editor", "Translations, audio and visitor content", "blue"],
          ].map(([name, desc, color]) => (
            <div className={color} key={name}>
              <Icon name="user" size={27} />
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </Panel>
      {edit && (
        <Modal
          title={edit.id ? "Manage staff record" : "Add someone to the team"}
          onClose={() => setEdit(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                email = f.get("email").trim().toLowerCase();
              if (staff.some((s) => s.email === email && s.id !== edit.id))
                return setError("This email already has a staff record.");
              const item = {
                id: edit.id || uid(),
                name: f.get("name").trim(),
                email,
                role: f.get("role"),
                active: f.get("active") === "on",
              };
              setStaff(
                edit.id
                  ? staff.map((s) => (s.id === edit.id ? item : s))
                  : [...staff, item],
              );
              setEdit(null);
              toast("Staff record saved locally; no email sent");
            }}
          >
            <Field label="Full name">
              <input name="name" required defaultValue={edit.name} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                name="email"
                required
                defaultValue={edit.email}
              />
            </Field>
            <Field label="Role">
              <select name="role" defaultValue={edit.role || "Editor"}>
                <option>Administrator</option>
                <option>Curator</option>
                <option>Editor</option>
              </select>
            </Field>
            <label className="pg-check">
              <input
                type="checkbox"
                name="active"
                defaultChecked={edit.active ?? true}
              />
              Active record
            </label>
            {error && (
              <p className="pg-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary">Save staff record</button>
          </form>
        </Modal>
      )}
    </>
  );
}
