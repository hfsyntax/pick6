export default function getScrollbarWidth(): number {
  const outer = document.createElement("div")
  outer.style.visibility = "hidden"
  outer.style.overflow = "scroll"
  document.body.appendChild(outer)
  const inner = document.createElement("div")
  outer.appendChild(inner)
  const calculatedScrollbarWidth = outer.offsetWidth - inner.offsetWidth
  outer.parentNode.removeChild(outer)
  return calculatedScrollbarWidth
}
