import {css} from "@emotion/core";

export const addition_menu_style = {
    background: "#156E8F",
    borderBottom: "none",
};

export const headerRightWrapper = css`
    display: flex;
    flex-direction: row;
    justify_content: space-between;
    max-width: 1024px;
    margin:auto;
    height: 100%;
    overflow: hidden;
`;

export const headerItem = css`
    display: inline-block;
    height: 100%;
    padding: 0 16px;
    cursor: pointer;
    transition: all 0.3s;
    > i {
        vertical-align: middle;
    }
    &:hover {
        background: rgba(0, 0, 0, 0.025);
    }
    .avatar {
        margin-right: 8px;
    }
`;

export const customAvatar = css`
    ${headerItem};
    margin-left: auto;
`;
