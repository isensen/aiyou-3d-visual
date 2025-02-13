# aiyou-3d-visual
玩玩3D可视化，要做一个3D可视化机房。

## 参考文档

[three 官方文档](https://threejs.org/docs/index.html#api/zh/)

[github地址](https://github.com/mrdoob/three.js)

[belnder基础教程大型创建（有声）](https://www.bilibili.com/video/BV1GK411P7M3?from=search&seid=13620439506336912099)

[入门视频0 网页3D设计基础｜webGL｜web3D｜Three.js｜Blender建模｜web3D渲染](https://www.bilibili.com/video/BV1U54y1i7Zf?p=2)

[入门视频0 文章](https://juejin.cn/post/6854573206708158471)

[入门视频0 其它文章](https://juejin.cn/post/6844903981450264584)

[Three.js其它文章](http://www.hewebgl.com/article/articledir/1)

[入门视频1 使用 THREE.js 搭建简单的 3D场景](https://www.bilibili.com/video/av78213651?spm_id_from=333.788.b_765f64657363.1)

[入门视频2 使用three.js加载3D模型以及处理点击事件的方法 ](https://www.bilibili.com/video/BV1ZJ411C7F6?from=search&seid=15885332407287474731)

[Vue + Three.js MMD展示性编辑器效果初步展示](https://www.bilibili.com/video/BV1Ef4y1D7WG/?spm_id_from=333.788.videocard.6)

## 疑难问题

### 渲染围墙时图片糊了

黄色区域就是糊的，绿色区域就是好的

![](./README_SOURCE/images/202101241615.png)

这是围墙

![围墙图片](./README_SOURCE/images/wall.png)

奇怪的是，只有前后方向的贴图糊了，其它没事

![](./README_SOURCE/images/20210124161722.png)

---

先查看渲染围墙这部分的代码

![](./README_SOURCE/images/20210124161646.png)

再看看加载图片部分的代码

![](./README_SOURCE/images/20210124161704.png)

都没发现问题，于是进行控制台打印，除了数据不同，其它都是好的，黄色区域的两个是左右，绿色区域的两个是前后

![](./README_SOURCE/images/20210124161739.png)

![](./README_SOURCE/images/20210124161748.png)

---

封装之后，忘记去改不同面的宽高，所以导致这种现象出现

![](./README_SOURCE/images/20210124161823.png)

![](./README_SOURCE/images/20210124161833.png)

![](./README_SOURCE/images/20210124161845.png)

总结：


原来是 一张小图片 在 一个大的墙面上进行repeat，居然设置的repeat 还是小于1的小数，所以图片被撕开了，同时平铺，如此一来就糊了。



正确：

![](./README_SOURCE/images/20210124163343.png)

![](./README_SOURCE/images/20210124164337.png)

![](./README_SOURCE/images/20210124163441.png)


错误：

![](./README_SOURCE/images/20210124161823.png)

![](./README_SOURCE/images/20210124161845.png)

![](./README_SOURCE/images/20210124161722.png)
