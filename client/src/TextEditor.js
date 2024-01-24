//npm i socket.io-client for client
import React, { useCallback, useEffect, useState } from 'react';
import Quill from "quill";
import 'quill/dist/quill.snow.css';
import io from 'socket.io-client';
import { useParams } from 'react-router';

const TOOLBAR_OPTIONS = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],

  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction

  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean']                                         // remove formatting button
];

const SAVE_INTERVAL_MS = 2000;

export default function TextEditor() {
  const {id: documentId} = useParams()
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  useEffect(() => {
    const s = io("https://localhost:3001")
    setSocket(s);

    return () => {
      s.disconnect();
    }
  }, [])

  useEffect(() => {
    if(socket == null || quill == null) return
    socket.once("load-document", document => {
      quill.setContents(document)
      quill.enable()
    })
    socket.emit('get-document', documentId)
  }, [socket, quill, documentId])

  useEffect(() => {
    if (socket == null || quill == null) return

    const interval = setInterval(() => {
      socket.emit('save-document', quill.getContents())
    }, SAVE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
    }
  }, [socket,quill])

  useEffect(() => {
    if (socket == null || quill == null) return
    
    const handler = (delta, oldDelta, source) => {
      quill.updateContents(delta)
    }
    socket.on("receive-changes", handler)
    return () => {
      socket.off('receive-changes', handler)
    }
  })

  useEffect(() => {
    if (socket == null || quill == null) return

    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return
      socket.emit("send-changes", handler)
    }
    return () => {
      quill.off('textchange', handler)
    }
  })

    const wrapperRef = useCallback(wrapper => {
        if(wrapper == null) return;

        wrapper.innerHTML = " "
        const editor = document.createElement('div')
        wrapper.append(editor)
        // Quill has two themes of snow and bubble
        // snow theme has the toolbar already on top
        // bubble theme shows the toolbar in the form of a bubble on selection of that text
        const q = new Quill(editor, {theme: 'snow', modules: { toolbar: TOOLBAR_OPTIONS }})
        q.enable(false)
        q.setText("Loading")
        setQuill(q);
    }, [])

  return (
    <div className="container" ref={wrapperRef}>
      
    </div>
  )
}