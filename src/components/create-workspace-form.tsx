"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { WorkspaceShell } from "@/components/workspace-shell";

export function CreateWorkspaceForm({ type, description }: { type: string; description: string }) {
  const [saved, setSaved] = useState(false);
  const returnPath = type === "Member" ? "/members" : type === "Community" ? "/communities" : type === "Event" ? "/events" : "/communications";
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaved(true); }
  return <WorkspaceShell title={`New ${type}`} subtitle={description}><section className="panel form-panel">{saved ? <div className="success-state"><CheckCircle2 size={28} /><h2>{type} draft created</h2><p>Your demo workspace saved this action locally for the next workflow step.</p><a className="primary-button" href={returnPath}>Return to workspace</a></div> : <form className="workspace-form" onSubmit={submit}><label>Name<input required placeholder={`Enter ${type.toLowerCase()} name`} /></label><label>Description<textarea required placeholder="Add a short description" rows={4} /></label><div className="form-actions"><a className="secondary-button" href={returnPath}><ArrowLeft size={15} />Cancel</a><button className="primary-button" type="submit">Save {type.toLowerCase()}</button></div></form>}</section></WorkspaceShell>;
}
