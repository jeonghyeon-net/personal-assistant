import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    background: transparent;
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }

  #root {
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    overflow: hidden;
  }

  ::-webkit-scrollbar {
    width: 5px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  button {
    font-family: inherit;
    cursor: pointer;
  }

  textarea {
    font-family: inherit;
  }
`
