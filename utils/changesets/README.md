# Overview

## changeset_version

`yarn changeset_publish` 接收两个可选参数：

- --no-git-push:表示 bump version 后不会自动 push

- --alpha:表示先进入 pre alpha 模式，后续的 bump version 也会携带 alpha 字段，在 alpha 期间 publish 时，打的 tag 也会携带 alpha

## changeset_publish

`yarn changeset_publish`，接收一个可选参数：

- --no-git-tag:表示 publish 后不打 tag（在发布 TTP 时使用）
