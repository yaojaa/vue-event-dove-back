'use strict';

/**
 * 分页插件类
 * @param page {Number} 当前页
 * @param perPage {Number} 每页记录数
 * @param total {Number} 总记录数
 * @param items {dict} 当前页记录列表
 * @constructor
 */
function Paginate(page, perPage, total, items){
    if(!page || page < 1){
        page = 1;
    }
    if(!perPage || perPage < 1){
        perPage = 10;
    }
    if(!total || total <0){
        total = 0;
    }
    if(!items){
        items = [];
    }

    this.perPage = perPage;
    this.total = total;
    this.items = items;
    this.currentPageTotal = items.length;         //当前页总数

    if(this.total%this.perPage ===0){
        this.totalPage = parseInt(this.total/this.perPage);      //总页数
    }else{
        this.totalPage = parseInt(this.total /this.perPage) + 1;
    }
    if(page>this.totalPage){
        this.page = this.totalPage;
    }else{
        this.page = page;
    }
}

/**
 * 当前开始的条数
 *
 */
Paginate.prototype.skip = function(){
    var skip = (this.page - 1)*this.perPage;
    if(skip > this.total){
        return (this.totalPage - 1)*this.perPage;
    }
    return skip;
}

/**
 * 设置当前页数
 * @param page {Number}
 */
Paginate.prototype.setPage = function(page){
    this.page = page;
}

/**
 * 设置每页条数
 * @param perPage
 */
Paginate.prototype.setPerPage = function(perPage){
    this.perPage = perPage;
}

/**
 * 是否有上一页
 * @returns {boolean}
 */
Paginate.prototype.hasPrevPage = function(){
    if(this.page >1){
        return true;
    }
    return false;
}

/**
 * 上一页
 * @returns {number}
 */
Paginate.prototype.prevPage = function(){
    if(this.page <= 1){
        return 1;
    }
    return this.page-1;
}

/**
 * 是否有下一页
 * @returns {boolean}
 */
Paginate.prototype.hasNextPage = function(){
    if(this.page < this.totalPage){
        return true;
    }
    return false;
}

/**
 * 下一页
 * @returns {*}
 */
Paginate.prototype.nextPage = function(){
    if(this.page < this.totalPage){
        return this.page+1;
    }
    return this.totalPage;
}

module.exports = Paginate;
