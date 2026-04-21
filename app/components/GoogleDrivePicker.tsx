"use client";

import { useEffect, useRef, useCallback } from "react";

const API_KEY    = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
const CLIENT_ID  = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const SCOPES     = "https://www.googleapis.com/auth/drive.readonly";
const MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/pdf",
  "text/plain",
].join(",");

export type DriveFile = { name: string; mimeType: string; content: string };

interface Props {
  onFile: (file: DriveFile) => void;
  children: (open: () => void, loading: boolean) => React.ReactNode;
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export default function GoogleDrivePicker({ onFile, children }: Props) {
  const tokenRef  = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const pickerReadyRef = useRef(false);

  // Pre-load both scripts on mount so the picker opens instantly on first click
  useEffect(() => {
    loadScript("https://apis.google.com/js/api.js").then(() => {
      if (window.gapi?.load) {
        window.gapi.load("picker", () => { pickerReadyRef.current = true; });
      }
    });
    loadScript("https://accounts.google.com/gsi/client");
  }, []);

  const fetchFileContent = useCallback(async (fileId: string, mimeType: string, token: string): Promise<string> => {
    // Google Sheets / Docs need export; Drive files download directly
    const isSheet = mimeType.includes("spreadsheet") || mimeType.includes("excel");
    const url = isSheet
      ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`
      : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Drive fetch failed: ${res.status}`);
    return res.text();
  }, []);

  const openPicker = useCallback((token: string) => {
    const picker = new window.google.picker.PickerBuilder()
      .setAppId(CLIENT_ID.split("-")[0])
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setTitle("Select a roster file")
      .addView(
        new window.google.picker.DocsView()
          .setMimeTypes(MIME_TYPES)
          .setIncludeFolders(true)
      )
      .addView(new window.google.picker.DocsUploadView())
      .setCallback(async (data: any) => {
        if (data.action !== window.google.picker.Action.PICKED) return;
        const doc      = data.docs[0];
        const content  = await fetchFileContent(doc.id, doc.mimeType, token);
        onFile({ name: doc.name, mimeType: doc.mimeType, content });
      })
      .build();
    picker.setVisible(true);
  }, [fetchFileContent, onFile]);

  const handleClick = useCallback(() => {
    if (loadingRef.current) return;

    // Reuse existing token if still valid
    if (tokenRef.current) {
      openPicker(tokenRef.current);
      return;
    }

    loadingRef.current = true;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        loadingRef.current = false;
        if (response.error) { console.error("OAuth error:", response.error); return; }
        tokenRef.current = response.access_token;
        openPicker(response.access_token);
      },
    });
    client.requestAccessToken({ prompt: "" });
  }, [openPicker]);

  return <>{children(handleClick, loadingRef.current)}</>;
}
