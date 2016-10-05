---
layout: "post"
title: "React Native 0.27.x adopt to xcode 8"
date: "2016-10-05 14:23:40"
---

React Native 0.27.0 adopt to xcode 8
====

# RCTSRWEBSOCKET.M error

> `Ignoring return value of function declared with warn_unused_result attribute`

Find line

> `SecRandomCopyBytes(kSecRandomDefault, sizeof(uint32_t), (uint8_t *)mask_key);`

Change to

> `(void)SecRandomCopyBytes(kSecRandomDefault, sizeof(uint32_t), (uint8_t *)mask_key);`


Find line

> `SecRandomCopyBytes(kSecRandomDefault, keyBytes.length, keyBytes.mutableBytes);`

Change to

> `(void)SecRandomCopyBytes(kSecRandomDefault, keyBytes.length, keyBytes.mutableBytes);`


# RCTSCROLLVIEW.M error

refer to [#7c8b914](https://github.com/facebook/react-native/commit/7c8b91442b3547cf94c752f234210bef0848c00a) to change the `node_modules/react-native/React/Views/RCTScrollView.m` file.

Then find below code in the `RCTScrollView.m` file:

```
- (NSArray<UIView *> *)reactSubviews
{
  if (_contentView && _scrollView.refreshControl) {
    return @[_contentView, _scrollView.refreshControl];
  }
return _contentView ? @[_contentView] : @[];
}
```

change to

```
- (NSArray<UIView *> *)reactSubviews
{
  if (_contentView && _scrollView.rctRefreshControl) {
    return @[_contentView, _scrollView.rctRefreshControl];
  }
  return _contentView ? @[_contentView] : @[];
}
```

[Example of the changed `RCTScrollView.m` in Gist](https://gist.github.com/yanqiw/5478681bb8eb1a7037f7a5b904a83f5e)
