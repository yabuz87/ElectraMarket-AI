"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageSquare, Send, Trash2, UserRound } from "lucide-react";
import { useProductData } from "../store/useProductStore";
import { useAuthStore } from "../store/useAuthStore";
import { dateFormatter } from "../utils";
import Spinner from "./Spinner";

const COMMENTS_PER_PAGE = 5;

export default function ProductComments({ productId }) {
  const authUser = useAuthStore((state) => state.authUser);
  const comments = useProductData((state) => state.comments);
  const totalComments = useProductData((state) => state.totalComments);
  const totalPages = useProductData((state) => state.totalCommentPages);
  const isLoading = useProductData((state) => state.isCommentLoading);
  const isPosting = useProductData((state) => state.isCommentPosting);
  const fetchComments = useProductData((state) => state.fetchProductComments);
  const createComment = useProductData((state) => state.createProductComment);
  const deleteComment = useProductData((state) => state.deleteProductComment);
  const [page, setPage] = useState(1);
  const [content, setContent] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchComments(productId, page, COMMENTS_PER_PAGE);
  }, [fetchComments, page, productId]);

  useEffect(() => setPage(1), [productId]);

  useEffect(() => {
    const refreshAfterAssistantComment = (event) => {
      if (event.detail?.productId !== productId) return;
      if (page !== 1) setPage(1);
      else fetchComments(productId, 1, COMMENTS_PER_PAGE);
    };
    window.addEventListener(
      "assistant:product-comment-created",
      refreshAfterAssistantComment
    );
    window.addEventListener("product:comments-changed", refreshAfterAssistantComment);
    return () =>
      {
        window.removeEventListener(
        "assistant:product-comment-created",
        refreshAfterAssistantComment
        );
        window.removeEventListener("product:comments-changed", refreshAfterAssistantComment);
      };
  }, [fetchComments, page, productId]);

  const submitComment = async (event) => {
    event.preventDefault();
    const message = content.trim();
    if (message.length < 2 || isPosting) return;
    const created = await createComment(productId, message);
    if (!created) return;
    setContent("");
    if (page !== 1) setPage(1);
    else await fetchComments(productId, 1, COMMENTS_PER_PAGE);
  };

  const removeComment = async (commentId) => {
    setDeletingId(commentId);
    const deleted = await deleteComment(productId, commentId);
    if (deleted) {
      const nextPage = comments.length === 1 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await fetchComments(productId, nextPage, COMMENTS_PER_PAGE);
    }
    setDeletingId(null);
  };

  return (
    <section className="product-comments" aria-labelledby="comments-heading">
      <header className="comments-heading">
        <div><span><MessageSquare size={21} /></span><div><h2 id="comments-heading">Customer comments</h2><p>{totalComments} {totalComments === 1 ? "comment" : "comments"}</p></div></div>
        <small>Shared publicly with all shoppers</small>
      </header>

      {authUser ? (
        <form className="comment-form" onSubmit={submitComment}>
          <div className="comment-avatar" aria-hidden="true"><UserRound size={20} /></div>
          <div className="comment-form__field">
            <label htmlFor="product-comment">Comment as {authUser.fullName}</label>
            <textarea id="product-comment" rows="3" maxLength="1000" placeholder="Share a useful thought about this product…" value={content} onChange={(event) => setContent(event.target.value)} />
            <div><small>{content.length}/1000</small><button className="btn btn-brand" type="submit" disabled={content.trim().length < 2 || isPosting}>{isPosting ? <Spinner /> : <><Send size={16} /> Post comment</>}</button></div>
          </div>
        </form>
      ) : (
        <div className="comment-login"><MessageSquare size={20} /><span><strong>Want to join the conversation?</strong><small>Everyone can read comments. Please sign in to write one.</small></span><Link href="/login" className="btn btn-soft">Sign in</Link></div>
      )}

      {isLoading ? (
        <div className="comments-loading"><Spinner /><span>Loading comments…</span></div>
      ) : comments.length ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <article className="comment-item" key={comment._id}>
              <div className="comment-avatar" aria-hidden="true">{comment.author.fullName.charAt(0).toUpperCase()}</div>
              <div className="comment-item__body">
                <div className="comment-meta"><div><strong>{comment.author.fullName}</strong><time dateTime={comment.createdAt}>{dateFormatter(comment.createdAt)}</time></div>{authUser?._id === comment.author._id && <button aria-label="Delete your comment" disabled={deletingId === comment._id} onClick={() => removeComment(comment._id)}>{deletingId === comment._id ? <span className="spinner-border spinner-border-sm" /> : <Trash2 size={16} />}</button>}</div>
                <p>{comment.content}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="comments-empty"><MessageSquare size={28} /><strong>No comments yet</strong><span>Be the first customer to share a thought.</span></div>
      )}

      {totalPages > 1 && <nav className="comment-pagination" aria-label="Comment pages"><button disabled={page === 1 || isLoading} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17} /> Previous</button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>Next <ChevronRight size={17} /></button></nav>}
    </section>
  );
}
