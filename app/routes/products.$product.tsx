import {useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

const ProductPage = () => {
  return <div>Loading...</div>;
};

export default ProductPage;
