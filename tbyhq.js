// --------------------------------------------------------------------
//
// ==UserScript==
// @name          淘宝优惠券显示
// @namespace     https://github.com/kingems/tbyhq
// @version       0.1.1
// @author        kingem(kingem@126.com)
// @description   淘宝优惠券显示
// @grant         GM_addStyle
// @grant         GM_xmlhttpRequest
// @require       https://cdn.staticfile.org/jquery/2.1.1/jquery.min.js
// @include       *://detail.ju.taobao.com/*
// @include       *://chaoshi.detail.tmall.com/*
// @include       *://world.taobao.com/*
// @include       *://detail.tmall.com/*
// @include       *://item.taobao.com/*
// @run-at        document-end
// ==/UserScript==
//
// --------------------------------------------------------------------
(function(){
    var itemId = "";
    var pid = "mm_17519173_5636609_56176445";
	function getQueryString(name){
		var reg=new RegExp("(^|&)"+name+"=([^&]*)(&|$)","i");
		var r=window.location.search.substr(1).match(reg);
		if(r!=null)return unescape(r[2]);
		return null;
	}
	function getQueryStringByUrl(url,name){
		var myUrl=url.substring(url.indexOf("?")+1);
		var reg=new RegExp("(^|&)"+name+"=([^&]*)(&|$)","i");
		var r=myUrl.match(reg);
		if(r!=null)return unescape(r[2]);
		else return"";
	}
	function insertHtml(){
		if($("#couponTipParent").length<=0){
			var containHtml='<div id="couponTipParent"><div id="myjiage"><a id="myjiageA" >正在查询中</a></div><div id="bijiaTable"><table id="jiatable" cellpadding="0" cellspacing="0"><thead> <tr><th>券面值(点击领取)</th><th>有效期</th><th>&nbsp;&nbsp;&nbsp;</th><th>券名称</th></tr></thead><tbody></tbody><tfoot></tfoot></table></div></div>';

            if(window.location.href.indexOf("detail.tmall.com")>-1){
				$(".tb-meta").append(containHtml);
			}else if(window.location.href.indexOf("item.taobao.com")>-1){
				$("ul.tb-meta").after(containHtml);
            }else{
                $("body").append(containHtml);
            }
			var sellerId=getSellerId();
			getQuanArrayStr(sellerId,itemId);
		}
	}
	function getSellerId(){
		var url=window.location.href;
		if(url.indexOf('detail.ju.taobao.com')!=-1){
			return $('.J_RightRecommend').attr('data-sellerid');
		}else if(url.indexOf('chaoshi.detail.tmall.com')!=-1){
			var d=$("#J_SellerInfo").attr("data-url");
			var e=d.match(/user_num_id=(\d+)/g);
			var f=String(e).split("=");
			return f[1];
		}else if(url.indexOf('world.taobao.com')!=-1){
			var d=$("#J_listBuyerOnView").attr("data-api");
			var e=d.match(/seller_num_id=(\d+)/g);
			var f=String(e).split("=");
			return f[1];
		}else{
			var meta=$('meta[name=microscope-data]').attr('content');
			if(meta){
				var userid=/userid=(\d+)/.exec(meta)[1];
				return userid;
			}
		}
	}
	function getQuanArrayStr(sellerId,itemid){
		quanList=new Array();
		isLogin=false;
		GM_xmlhttpRequest({
            method: 'GET',
            url: "https://cart.taobao.com/json/GetPriceVolume.do?sellerId="+sellerId,
            overrideMimeType:"text/html;charset=gbk",
            onload: function(response) {
				if(response.status=="200"){
					isLogin=true;
					var trItems="";
					var cartDataList=JSON.parse(response.responseText).priceVolumes;
					for(var i=0;i<cartDataList.length;i++){
						quanList.push(cartDataList[i].id);
						var getQuanUrl="https://uland.taobao.com/coupon/edetail?pid="+pid+"&activityId="+cartDataList[i].id+"&itemId="+itemId;
						trItems+="<tr><td class='valueTd'><a href='"+getQuanUrl+"' target='_blank'>"+cartDataList[i].condition.substring(0,cartDataList[i].condition.length-cartDataList[i].price.length)+"<span class='quanValue'>"+cartDataList[i].price+"</span>元</a></td><td>"+cartDataList[i].timeRange.substr(11)+"之前</td><td>&nbsp;&nbsp;&nbsp;</td><td>"+cartDataList[i].title+"</td></tr>";
					}
					$("#myjiageA").html("发现"+quanList.length+"张优惠券");
					$("#bijiaTable #jiatable tbody").append(trItems);
				}
				GM_xmlhttpRequest({
		            method: 'GET',
		            url: "http://www.qingtaoke.com/api/UserPlan/UserCouponList?sid="+sellerId+"&gid="+itemId,
		            overrideMimeType:"text/html;charset=gbk",
		            onload: function(response) {
						var hasHidden="";
						if(response.responseText!=null){
							var zhushouDataList=JSON.parse(response.responseText).data;
							for(var i=0;i<zhushouDataList.length;i++){
								var thisItem=zhushouDataList[i].activityId;
								if($.inArray(thisItem,quanList)<0){
									quanList.unshift(thisItem);
									hasHidden="【有隐藏券】";
									var isHiddenStr="";
									if(isLogin){
										isHiddenStr="【隐藏券】";
									}
									getSingleQuanItemInfo(thisItem,isHiddenStr);
								}
							}
						}
						if(quanList.length>0){
							if(isLogin){
								$("#myjiageA").html("发现"+quanList.length+"张优惠券"+hasHidden);
							}else{
								$("#myjiageA").html("发现"+quanList.length+"张优惠券"+" <font size='0.5'>登录查看更多</font>");
							}
						}else{
							if(isLogin){
								$("#myjiageA").html("未发现优惠券 查看其他》");
							}else{
								$("#myjiageA").html("您未登录淘宝，无法查询");
							}
						}
						GM_xmlhttpRequest({
				            method: 'GET',
				            url: "http://vip.taoqueqiao.com/?mod=inc&act=plugin&do=quan&iid="+itemId,
				            overrideMimeType:"text/html;charset=gbk",
				            onload: function(response) {
		                        try{
		                            var zyQuanStr=JSON.parse(response.responseText).r;
		                            if(zyQuanStr!=undefined){
		                                quanList.unshift(zyQuanStr);
		                                getSingleQuanItemInfo(zyQuanStr,"【专用券】");
		                                $("#myjiageA").html("发现"+quanList.length+"张优惠券【有专用券】");
		                            }
		                        }catch(err){}
		                    }
		                });
					}
				});
			}
		});
	}
	function getSingleQuanItemInfo(activityId,tipStr){
		GM_xmlhttpRequest({
            method: 'GET',
            url: "https://uland.taobao.com/cp/coupon?activityId="+activityId+"&itemId="+itemId,
            overrideMimeType:"text/html;charset=UTF-8",
            onload: function(response) {
				var quanDetail=JSON.parse(response.responseText).result;
				var getQuanUrl="https://uland.taobao.com/coupon/edetail?pid="+pid+"&activityId="+activityId+"&itemId="+itemId;
				var trItem="";
				if(response.status=="200"){
					if(quanDetail.amount!=null){
						trItem='<tr><td class="valueTd"><a href="'+getQuanUrl+'" target="_blank">满'+quanDetail.startFee+'减<span class="quanValue">'+quanDetail.amount+'</span>元'+tipStr+'</a></td><td>'+quanDetail.effectiveEndTime.replace("23:59:59","")+'之前</td><td>&nbsp;&nbsp;&nbsp;</td><td>'+quanDetail.shopName+'</td></tr>';
					}else{
						trItem="<tr><td class='valueTd'><a href='"+getQuanUrl+"' target='_blank'><span>点此查看</span></a></td><td>券可能失效</td><td></td></tr>";
					}
				}else{
					trItem="<tr><td class='valueTd'><a href='"+getQuanUrl+"' target='_blank'><span>点此查看</span></a></td><td>券可能失效</td><td></td></tr>";
				}
				$("#bijiaTable #jiatable tbody").prepend(trItem);
			}
		});
	}
    setTimeout(function(){
        itemId = getQueryString("id");
        insertHtml();
	}, 500);
})();
