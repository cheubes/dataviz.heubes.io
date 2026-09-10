export function getMaxStageBlockHeight(): number {
  const header = document.querySelector('.dv-header');
  const footer = document.querySelector('.dv-footer');
  const headerHeight = header?.getBoundingClientRect().height ?? 0;
  const footerHeight = footer?.getBoundingClientRect().height ?? 0;
  return window.innerHeight - headerHeight - footerHeight;
}
