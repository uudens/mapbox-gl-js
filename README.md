## grid lines visible near edges

For demonstration I made a quick modification of your render test to render a larger size and render our style

Weird pattern overlap lines become visible for larger map size

How to reproduce:  
1. clone this fork and checkout this branch  
2. ```npm run test-render && open out.png``` it should generate 6000x6000px map

Observe: weird grid lines appear near the edges, maybe pattern is overlapping?
[<img alt="heavy 6000x6000px image" src="https://grafomap.com/gridlines.png">](https://grafomap.com/6000x6000.png)
