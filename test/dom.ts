import { GlobalRegistrator } from "@happy-dom/global-registrator"

// The player's React parts need a DOM in tests. alphaTab's own tests pass with
// it present, so one DOM serves the whole run.
GlobalRegistrator.register()
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
